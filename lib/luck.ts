import type { LeagueState } from '@/types'

export interface LuckEntry {
  owner: string
  actualWins: number
  expectedWins: number
  luckIndex: number
  narrative: 'The League Martyr' | 'Lucky' | null
}

/**
 * Expected wins (all-play) vs actual head-to-head wins, both computed from
 * the same weekly matchup data — pass a pre-filtered `matchups` map to scope
 * the result (e.g. completed seasons only for all-time stats, or the raw map
 * with `filterYear` for the live season on This Week).
 */
export function computeLuckIndex(
  matchups: LeagueState['matchups'],
  rosterUserMaps: LeagueState['rosterUserMaps'],
  filterYear?: number
): LuckEntry[] {
  const expectedWinsMap: Record<string, number> = {}
  const actualWinsMap: Record<string, number> = {}

  for (const yearStr of Object.keys(matchups)) {
    const year = Number(yearStr)
    if (filterYear != null && year !== filterYear) continue
    const weekMap = matchups[year]
    const rosterMap = rosterUserMaps[year] ?? {}

    for (const weekStr of Object.keys(weekMap)) {
      const { matchups: weekMatchups, isPlayoff } = weekMap[Number(weekStr)]
      if (isPlayoff) continue

      // ── Expected wins: all-play vs every scored team this week ──────────
      const teamScores = weekMatchups
        .map(m => ({
          owner: rosterMap[String(m.roster_id)] ?? `Team${m.roster_id}`,
          score: m.points ?? 0,
        }))
        .filter(t => t.score > 0)

      const N = teamScores.length
      if (N < 2) continue

      for (const team of teamScores) {
        const beaten = teamScores.filter(
          t => t.owner !== team.owner && t.score < team.score
        ).length
        expectedWinsMap[team.owner] = (expectedWinsMap[team.owner] ?? 0) + beaten / (N - 1)
      }

      // ── Actual wins: head-to-head pairs (median pseudo-games excluded by
      // the group-of-2 check, matching buildOwnerSeasons) ──────────────────
      const groups: Record<number, typeof weekMatchups> = {}
      weekMatchups.forEach(m => {
        if (!groups[m.matchup_id]) groups[m.matchup_id] = []
        groups[m.matchup_id].push(m)
      })
      for (const group of Object.values(groups)) {
        if (group.length !== 2) continue
        const [a, b] = group
        const ptsA = a.points ?? 0
        const ptsB = b.points ?? 0
        if (ptsA <= 0 && ptsB <= 0) continue  // unplayed
        if (ptsA === ptsB) continue           // tie: no win either way
        const winner = ptsA > ptsB ? a : b
        const owner = rosterMap[String(winner.roster_id)] ?? `Team${winner.roster_id}`
        actualWinsMap[owner] = (actualWinsMap[owner] ?? 0) + 1
      }
    }
  }

  const entries: LuckEntry[] = Object.keys(expectedWinsMap).map(owner => {
    const actualWins = actualWinsMap[owner] ?? 0
    const expectedWins = expectedWinsMap[owner]
    const luckIndex = actualWins - expectedWins

    let narrative: LuckEntry['narrative'] = null
    if (luckIndex < -2.0) narrative = 'The League Martyr'
    else if (luckIndex > 2.0) narrative = 'Lucky'

    return {
      owner,
      actualWins,
      expectedWins: Math.round(expectedWins * 100) / 100,
      luckIndex: Math.round(luckIndex * 100) / 100,
      narrative,
    }
  })

  // Sort descending — luckiest first
  return entries.sort((a, b) => b.luckIndex - a.luckIndex)
}
