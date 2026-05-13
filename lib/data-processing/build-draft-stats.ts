import type { LeagueState, DraftPick, PlayerStat, OwnerSeason } from '@/types'
import type { PlayerMetadata } from '@/lib/players-cache'
import { playerDisplayName } from '@/lib/players-cache'

// ─── Player Win Rates ─────────────────────────────────────────────────────────
// Uses already-fetched starters[] / starters_points[] in LeagueState — zero new API calls.

interface WinRateAccum {
  games: number
  wins: number
  ownerCounts: Record<string, number>
  yearCounts: Record<number, { games: number; wins: number }>
  position: string
  team: string
  name: string
}

export function computePlayerWinRates(
  state: LeagueState,
  playersCache: Record<string, PlayerMetadata>
): PlayerStat[] {
  const accum: Record<string, WinRateAccum> = {}

  for (const year of Object.keys(state.matchups).map(Number)) {
    const rMap = state.rosterUserMaps[year] ?? {}

    for (const [, { matchups }] of Object.entries(state.matchups[year])) {
      // Group by matchup_id to determine winner
      const groups: Record<number, typeof matchups> = {}
      matchups.forEach(m => {
        if (!groups[m.matchup_id]) groups[m.matchup_id] = []
        groups[m.matchup_id].push(m)
      })

      for (const pair of Object.values(groups)) {
        if (pair.length !== 2) continue
        const [a, b] = pair
        const aWon = (a.points ?? 0) >= (b.points ?? 0)
        const ownerA = rMap[String(a.roster_id)] ?? `Team${a.roster_id}`
        const ownerB = rMap[String(b.roster_id)] ?? `Team${b.roster_id}`

        for (const [entry, won, owner] of [[a, aWon, ownerA], [b, !aWon, ownerB]] as [typeof a, boolean, string][]) {
          const starters = entry.starters ?? []
          for (const pid of starters) {
            if (!pid || pid === '0') continue
            if (!accum[pid]) {
              const p = playersCache[pid]
              accum[pid] = {
                games: 0,
                wins: 0,
                ownerCounts: {},
                yearCounts: {},
                position: p?.position ?? '?',
                team: p?.team ?? '',
                name: playerDisplayName(p, pid),
              }
            }
            accum[pid].games++
            if (won) accum[pid].wins++
            accum[pid].ownerCounts[owner] = (accum[pid].ownerCounts[owner] ?? 0) + 1
            if (!accum[pid].yearCounts[year]) accum[pid].yearCounts[year] = { games: 0, wins: 0 }
            accum[pid].yearCounts[year].games++
            if (won) accum[pid].yearCounts[year].wins++
          }
        }
      }
    }
  }

  return Object.entries(accum)
    .filter(([, a]) => a.games >= 3)
    .map(([player_id, a]) => {
      const topOwner = Object.entries(a.ownerCounts).sort((x, y) => y[1] - x[1])[0]?.[0] ?? ''
      const yearStats = Object.entries(a.yearCounts)
        .sort(([ya], [yb]) => Number(ya) - Number(yb))
        .map(([year, s]) => ({ year: Number(year), games: s.games, wins: s.wins }))
      return {
        player_id,
        name: a.name,
        position: a.position,
        team: a.team,
        games: a.games,
        wins: a.wins,
        winRate: a.games > 0 ? a.wins / a.games : 0,
        topOwner,
        ownerCounts: a.ownerCounts,
        yearStats,
      }
    })
    .sort((a, b) => b.games - a.games)
}

// ─── Draft Ownership ──────────────────────────────────────────────────────────

export interface OwnershipEntry {
  player_id: string
  name: string
  position: string
  team: string
  picks: { owner: string; year: number; round: number; pickNo: number }[]
  avgPickNo: number
}

export function computeDraftOwnership(
  draftPicksByYear: Record<number, DraftPick[]>,
  rosterUserMaps: LeagueState['rosterUserMaps'],
  playersCache: Record<string, PlayerMetadata>
): OwnershipEntry[] {
  const byPlayer: Record<string, OwnershipEntry> = {}

  for (const [yearStr, picks] of Object.entries(draftPicksByYear)) {
    const year = Number(yearStr)
    const rMap = rosterUserMaps[year] ?? {}

    for (const pick of picks) {
      const { player_id, round, pick_no, roster_id } = pick
      if (!player_id) continue

      const owner = rMap[String(roster_id)] ?? `Team${roster_id}`
      const p = playersCache[player_id]

      if (!byPlayer[player_id]) {
        byPlayer[player_id] = {
          player_id,
          name: playerDisplayName(p, player_id),
          position: p?.position ?? pick.metadata?.position ?? '?',
          team: p?.team ?? pick.metadata?.team ?? '',
          picks: [],
          avgPickNo: 0,
        }
      }

      byPlayer[player_id].picks.push({ owner, year, round, pickNo: pick_no })
    }
  }

  for (const entry of Object.values(byPlayer)) {
    entry.avgPickNo = entry.picks.reduce((s, p) => s + p.pickNo, 0) / entry.picks.length
  }

  return Object.values(byPlayer).sort((a, b) => a.avgPickNo - b.avgPickNo)
}

// ─── Draft Structure Win Rate ─────────────────────────────────────────────────

export type DraftStrategy = 'Zero-RB' | 'Hero-RB' | 'RB-Heavy' | 'WR-Heavy' | 'Balanced'

export interface DraftStructureEntry {
  strategy: DraftStrategy
  count: number
  avgWins: number
  avgFinish: number
  examples: { owner: string; year: number }[]
}

function classifyStrategy(picks: DraftPick[], earlyCount: { rb: number; wr: number }): DraftStrategy {
  const { rb, wr } = earlyCount
  if (rb === 0) return 'Zero-RB'
  if (rb >= 3) return 'RB-Heavy'
  // Round 1 pick is RB = Hero-RB
  const r1Pick = picks.find(p => p.round === 1)
  if (r1Pick?.metadata?.position === 'RB') return 'Hero-RB'
  if (wr >= 3 && rb <= 1) return 'WR-Heavy'
  return 'Balanced'
}

export function computeDraftStructure(
  draftPicksByYear: Record<number, DraftPick[]>,
  ownerSeasons: Record<string, OwnerSeason[]>,
  rosterUserMaps: LeagueState['rosterUserMaps']
): DraftStructureEntry[] {
  const strategyMap: Record<DraftStrategy, { wins: number[]; finishes: number[]; examples: { owner: string; year: number }[] }> = {
    'Zero-RB':  { wins: [], finishes: [], examples: [] },
    'Hero-RB':  { wins: [], finishes: [], examples: [] },
    'RB-Heavy': { wins: [], finishes: [], examples: [] },
    'WR-Heavy': { wins: [], finishes: [], examples: [] },
    'Balanced': { wins: [], finishes: [], examples: [] },
  }

  for (const [yearStr, picks] of Object.entries(draftPicksByYear)) {
    const year = Number(yearStr)
    const rMap = rosterUserMaps[year] ?? {}

    // Group picks by roster_id
    const byRoster: Record<number, DraftPick[]> = {}
    for (const pick of picks) {
      if (!byRoster[pick.roster_id]) byRoster[pick.roster_id] = []
      byRoster[pick.roster_id].push(pick)
    }

    for (const [rosterIdStr, rPicks] of Object.entries(byRoster)) {
      const owner = rMap[rosterIdStr] ?? `Team${rosterIdStr}`
      const early = rPicks.filter(p => p.round <= 5)
      const count = {
        rb: early.filter(p => p.metadata?.position === 'RB').length,
        wr: early.filter(p => p.metadata?.position === 'WR').length,
      }
      const strategy = classifyStrategy(rPicks, count)

      const season = ownerSeasons[owner]?.find(s => s.year === year)
      if (!season) continue

      strategyMap[strategy].wins.push(season.wins)
      if (season.finish != null) strategyMap[strategy].finishes.push(season.finish)
      strategyMap[strategy].examples.push({ owner, year })
    }
  }

  return (Object.entries(strategyMap) as [DraftStrategy, typeof strategyMap[DraftStrategy]][])
    .map(([strategy, data]) => ({
      strategy,
      count: data.wins.length,
      avgWins: data.wins.length > 0 ? data.wins.reduce((s, w) => s + w, 0) / data.wins.length : 0,
      avgFinish: data.finishes.length > 0 ? data.finishes.reduce((s, f) => s + f, 0) / data.finishes.length : 0,
      examples: data.examples,
    }))
    .filter(e => e.count > 0)
    .sort((a, b) => a.avgFinish - b.avgFinish)
}
