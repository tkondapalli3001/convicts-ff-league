import type { LeagueState } from '@/types'

export interface LuckEntry {
  owner: string
  actualWins: number
  expectedWins: number
  luckIndex: number
  narrative: 'The League Martyr' | 'Lucky' | null
}

export function computeLuckIndex(
  matchups: LeagueState['matchups'],
  rosterUserMaps: LeagueState['rosterUserMaps'],
  ownerSeasons: LeagueState['ownerSeasons'],
  filterYear?: number
): LuckEntry[] {
  const expectedWinsMap: Record<string, number> = {}

  // Step 1: accumulate expected wins from weekly matchup data (regular season only)
  for (const yearStr of Object.keys(matchups)) {
    const year = Number(yearStr)
    if (filterYear != null && year !== filterYear) continue
    const weekMap = matchups[year]
    const rosterMap = rosterUserMaps[year] ?? {}

    for (const weekStr of Object.keys(weekMap)) {
      const { matchups: weekMatchups, isPlayoff } = weekMap[Number(weekStr)]
      if (isPlayoff) continue

      // Resolve roster_id → owner name, skip entries with no score
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
    }
  }

  // Step 2: accumulate actual wins from ownerSeasons
  const entries: LuckEntry[] = Object.keys(ownerSeasons)
    .filter(owner => expectedWinsMap[owner] !== undefined)
    .map(owner => {
      const seasons = filterYear != null
        ? ownerSeasons[owner].filter(s => s.year === filterYear)
        : ownerSeasons[owner]
      const actualWins = seasons.reduce((sum, s) => sum + s.wins, 0)
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

  // Step 3: sort descending — luckiest first
  return entries.sort((a, b) => b.luckIndex - a.luckIndex)
}
