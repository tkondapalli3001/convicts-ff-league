import type { LeagueState, DraftPick, PlayerStat, OwnerSeason } from '@/types'
import { USER_ID_TO_OWNER } from '@/lib/league'
import type { PlayerMetadata } from '@/lib/sources'
import { playerDisplayName } from '@/lib/sources'
import { isSeasonComplete } from './season-settings'

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

  for (const year of Object.keys(state.matchups).map(Number).filter(y => isSeasonComplete(state.leagues[y]))) {
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

// ─── Player Scoring ───────────────────────────────────────────────────────────

export interface PlayerScoreStat {
  player_id: string
  name: string
  position: string
  team: string
  /** owner → year → { pts, games } */
  byOwnerYear: Record<string, Record<number, { pts: number; games: number }>>
}

export function computePlayerScores(
  state: LeagueState,
  playersCache: Record<string, PlayerMetadata>
): PlayerScoreStat[] {
  const accum: Record<string, PlayerScoreStat> = {}

  for (const [yearStr, weekMap] of Object.entries(state.matchups)) {
    const year = Number(yearStr)
    if (!isSeasonComplete(state.leagues[year])) continue
    const rMap = state.rosterUserMaps[year] ?? {}

    for (const [, { matchups }] of Object.entries(weekMap)) {
      for (const entry of matchups) {
        const owner = rMap[String(entry.roster_id)] ?? `Team${entry.roster_id}`
        const starters = entry.starters ?? []
        const pts = entry.starters_points ?? []

        starters.forEach((pid, i) => {
          if (!pid || pid === '0') return
          const pointsThisGame = pts[i] ?? 0

          if (!accum[pid]) {
            const p = playersCache[pid]
            accum[pid] = {
              player_id: pid,
              name: playerDisplayName(p, pid),
              position: p?.position ?? '?',
              team: p?.team ?? '',
              byOwnerYear: {},
            }
          }

          if (!accum[pid].byOwnerYear[owner]) accum[pid].byOwnerYear[owner] = {}
          const slot = accum[pid].byOwnerYear[owner]
          if (!slot[year]) slot[year] = { pts: 0, games: 0 }
          slot[year].pts += pointsThisGame
          slot[year].games++
        })
      }
    }
  }

  return Object.values(accum)
}

// ─── Players → Scoring: the Top 25 ──

export type ScoringSortKey = 'rank' | 'name' | 'position' | 'totalPoints' | 'games' | 'avgPPG'

/** What the Scoring table is showing: its filters and sort. */
export interface ScoringView {
  year: number | 'all'
  owner: string | 'all'
  pos: string
  sortKey: ScoringSortKey
  sortDir: 1 | -1
}

/** How the table opens (the build bakes this view into the HTML). */
export const DEFAULT_SCORING_VIEW: ScoringView = { year: 'all', owner: 'all', pos: 'ALL', sortKey: 'totalPoints', sortDir: -1 }

export interface ScoringRow {
  player_id: string
  name: string
  position: string
  team: string
  totalPoints: number
  games: number
  avgPPG: number
}

const FLEX_POSITIONS = new Set(['QB', 'RB', 'WR', 'TE'])

/** The 25 rows the Scoring table shows for one view. */
export function scoringRows(playerScores: PlayerScoreStat[], { year, owner, pos, sortKey, sortDir }: ScoringView): ScoringRow[] {
  return playerScores
    .filter(p => {
      if (pos === 'ALL') return true
      if (pos === 'FLEX') return FLEX_POSITIONS.has(p.position)
      return p.position === pos
    })
    .map(p => {
      let totalPoints = 0
      let games = 0
      for (const [o, yearMap] of Object.entries(p.byOwnerYear)) {
        if (owner !== 'all' && o !== owner) continue
        for (const [yr, { pts, games: g }] of Object.entries(yearMap)) {
          if (year !== 'all' && Number(yr) !== year) continue
          totalPoints += pts
          games += g
        }
      }
      return {
        player_id: p.player_id,
        name: p.name,
        position: p.position,
        team: p.team,
        totalPoints,
        games,
        avgPPG: games > 0 ? totalPoints / games : 0,
      }
    })
    .filter(r => r.games > 0 && r.totalPoints > 0)
    .sort((a, b) => {
      const av = a[sortKey === 'rank' ? 'totalPoints' : sortKey]
      const bv = b[sortKey === 'rank' ? 'totalPoints' : sortKey]
      if (typeof av === 'string') return (av as string).localeCompare(bv as string) * sortDir
      return ((av as number) - (bv as number)) * sortDir
    })
    .slice(0, 25)
}

/** The position chips: the fixed order, keeping the positions anyone started. */
export function scoringPositions(playerScores: PlayerScoreStat[]): string[] {
  const set = new Set(playerScores.map(p => p.position).filter(Boolean))
  return ['ALL', 'QB', 'RB', 'WR', 'TE', 'FLEX', 'K', 'DEF'].filter(p => p === 'ALL' || p === 'FLEX' || set.has(p))
}

/** Owner filter names on the Players page: every canonical owner with a completed season, A–Z. */
export function playerPageOwners(ownerSeasons: LeagueState['ownerSeasons']): string[] {
  return [...new Set(Object.values(USER_ID_TO_OWNER))].filter(n => ownerSeasons[n]).sort()
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
          // Picks carry their own name — covers rookies newer than the player index
          name: playerDisplayName(p ?? pick.metadata, player_id),
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

export type DraftStrategy = 'Zero-RB' | 'Hero-RB' | 'RB-Heavy' | 'Balanced'

export interface DraftStructureEntry {
  strategy: DraftStrategy
  count: number
  avgWins: number
  avgFinish: number
  examples: { owner: string; year: number; finish: number | null; madePlayoffs: boolean }[]
}

function classifyStrategy(picks: DraftPick[], earlyCount: { rb: number; wr: number }): DraftStrategy {
  const { rb } = earlyCount
  if (rb === 0) return 'Zero-RB'
  if (rb >= 3) return 'RB-Heavy'
  const r1Pick = picks.find(p => p.round === 1)
  if (r1Pick?.metadata?.position === 'RB') return 'Hero-RB'
  return 'Balanced'
}

export function computeDraftStructure(
  draftPicksByYear: Record<number, DraftPick[]>,
  ownerSeasons: Record<string, OwnerSeason[]>,
  rosterUserMaps: LeagueState['rosterUserMaps']
): DraftStructureEntry[] {
  const strategyMap: Record<DraftStrategy, { wins: number[]; finishes: number[]; examples: { owner: string; year: number; finish: number | null; madePlayoffs: boolean }[] }> = {
    'Zero-RB':  { wins: [], finishes: [], examples: [] },
    'Hero-RB':  { wins: [], finishes: [], examples: [] },
    'RB-Heavy': { wins: [], finishes: [], examples: [] },
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
      strategyMap[strategy].examples.push({
        owner,
        year,
        finish: season.finish ?? null,
        madePlayoffs: season.inPlayoffs ?? false,
      })
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
