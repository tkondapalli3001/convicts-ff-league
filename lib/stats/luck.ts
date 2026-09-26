// The one Luck Index implementation — Seasons standings, Records fun facts,
// search, 2026 smack talk, power rankings' all-play, and
// scripts/luck-index.mjs all read from here.
//
// Type-only imports on purpose: scripts/luck-index.mjs loads this file
// straight into Node (type stripping), where '@/' aliases can't resolve.
import type { LeagueState } from '@/types'

export interface AllPlayRecord {
  wins: number
  losses: number
  ties: number
  /** Σ over weeks of (teams outscored + ½ × teams tied) / (teams that played − 1). */
  expectedWins: number
}

export interface LuckEntry {
  owner: string
  /** Head-to-head wins, ties counting ½. */
  actualWins: number
  expectedWins: number
  /** actualWins − expectedWins: positive = more wins than the points deserved. */
  luckIndex: number
  narrative: 'The League Martyr' | 'Lucky' | null
}

/**
 * All-play records from weekly scores: every team against every other team
 * that played that week. A team that didn't score sat the week out.
 */
export function allPlayRecords(weeks: { name: string; pts: number }[][]): Record<string, AllPlayRecord> {
  const out: Record<string, AllPlayRecord> = {}
  for (const week of weeks) {
    const played = week.filter(t => t.pts > 0)
    if (played.length < 2) continue
    for (const me of played) {
      let wins = 0
      let ties = 0
      for (const other of played) {
        if (other.name === me.name) continue
        if (me.pts > other.pts) wins++
        else if (me.pts === other.pts) ties++
      }
      const r = (out[me.name] ??= { wins: 0, losses: 0, ties: 0, expectedWins: 0 })
      r.wins += wins
      r.ties += ties
      r.losses += played.length - 1 - wins - ties
      r.expectedWins += (wins + ties / 2) / (played.length - 1)
    }
  }
  return out
}

/**
 * Luck Index = actual wins − all-play expected wins, regular season only.
 * Pass a pre-filtered `matchups` map to scope it (completed seasons for career
 * luck), or `filterYear` for a single season.
 */
export function computeLuckIndex(
  matchups: LeagueState['matchups'],
  rosterUserMaps: LeagueState['rosterUserMaps'],
  filterYear?: number,
): LuckEntry[] {
  const weeks: { name: string; pts: number }[][] = []
  const actual: Record<string, number> = {}

  for (const yearStr of Object.keys(matchups)) {
    const year = Number(yearStr)
    if (filterYear != null && year !== filterYear) continue
    const rMap = rosterUserMaps[year] ?? {}
    const owner = (rosterId: number) => rMap[String(rosterId)] ?? `Team${rosterId}`

    for (const { matchups: rows, isPlayoff } of Object.values(matchups[year])) {
      if (isPlayoff) continue
      weeks.push(rows.map(m => ({ name: owner(m.roster_id), pts: m.points ?? 0 })))

      // Head-to-head pairs (median pseudo-games are excluded by the pair
      // check, matching buildOwnerSeasons)
      const groups: Record<number, typeof rows> = {}
      for (const m of rows) (groups[m.matchup_id] ??= []).push(m)
      for (const pair of Object.values(groups)) {
        if (pair.length !== 2) continue
        const [a, b] = pair
        const ptsA = a.points ?? 0
        const ptsB = b.points ?? 0
        if (ptsA <= 0 && ptsB <= 0) continue // unplayed
        actual[owner(a.roster_id)] = (actual[owner(a.roster_id)] ?? 0) + (ptsA > ptsB ? 1 : ptsA === ptsB ? 0.5 : 0)
        actual[owner(b.roster_id)] = (actual[owner(b.roster_id)] ?? 0) + (ptsB > ptsA ? 1 : ptsA === ptsB ? 0.5 : 0)
      }
    }
  }

  return Object.entries(allPlayRecords(weeks))
    .map(([owner, r]) => {
      const actualWins = actual[owner] ?? 0
      const luckIndex = actualWins - r.expectedWins
      return {
        owner,
        actualWins,
        expectedWins: Math.round(r.expectedWins * 100) / 100,
        luckIndex: Math.round(luckIndex * 100) / 100,
        narrative: luckIndex < -2 ? 'The League Martyr' as const : luckIndex > 2 ? 'Lucky' as const : null,
      }
    })
    .sort((a, b) => b.luckIndex - a.luckIndex) // luckiest first
}
