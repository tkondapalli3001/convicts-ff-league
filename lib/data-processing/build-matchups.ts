import type { LeagueState, Matchup } from '@/types'

export function buildFlatMatchups(state: LeagueState): Matchup[] {
  const allMatchups: Matchup[] = []

  const loadedYears = Object.keys(state.matchups)
    .map(Number)
    .sort((a, b) => a - b)

  for (const year of loadedYears) {
    if (!state.matchups[year]) continue
    const rMap = state.rosterUserMaps[year] || {}

    for (const [weekStr, { matchups, isPlayoff }] of Object.entries(state.matchups[year])) {
      const week = parseInt(weekStr)
      // Group by matchup_id
      const groups: Record<number, typeof matchups> = {}
      matchups.forEach(m => {
        if (!groups[m.matchup_id]) groups[m.matchup_id] = []
        groups[m.matchup_id].push(m)
      })

      for (const group of Object.values(groups)) {
        if (group.length !== 2) continue
        const [a, b] = group
        const nameA = rMap[String(a.roster_id)] || `Team${a.roster_id}`
        const nameB = rMap[String(b.roster_id)] || `Team${b.roster_id}`
        const ptsA = a.points || 0
        const ptsB = b.points || 0
        allMatchups.push({
          year,
          week,
          team1: nameA, pts1: ptsA, roster1: a.roster_id,
          team2: nameB, pts2: ptsB, roster2: b.roster_id,
          type: isPlayoff ? 'P' : 'R',
          winner: ptsA >= ptsB ? nameA : nameB,
          loser:  ptsA >= ptsB ? nameB : nameA,
          margin: Math.abs(ptsA - ptsB),
        })
      }
    }
  }

  allMatchups.sort((a, b) => a.year - b.year || a.week - b.week)
  return allMatchups
}
