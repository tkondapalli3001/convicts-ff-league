import type { LeagueState, Matchup } from '@/types'
import { isSeasonComplete } from './build-seasons'

/**
 * Flatten one season's raw weekly matchups into Matchup[] rows. Used by
 * buildFlatMatchups for completed seasons and by the This Week preview
 * engine, which needs the live season's games too.
 */
export function flattenSeasonMatchups(state: LeagueState, year: number): Matchup[] {
  const out: Matchup[] = []
  const weekMap = state.matchups[year]
  if (!weekMap) return out
  const rMap = state.rosterUserMaps[year] || {}

  for (const [weekStr, { matchups, isPlayoff }] of Object.entries(weekMap)) {
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
      out.push({
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

  return out
}

export function buildFlatMatchups(state: LeagueState): Matchup[] {
  // Completed seasons only — allMatchups feeds the record book, streaks, H2H,
  // and search, none of which award anything until a season is final
  const loadedYears = Object.keys(state.matchups)
    .map(Number)
    .filter(year => isSeasonComplete(state.leagues[year]))
    .sort((a, b) => a - b)

  const allMatchups: Matchup[] = []
  for (const year of loadedYears) {
    allMatchups.push(...flattenSeasonMatchups(state, year))
  }

  allMatchups.sort((a, b) => a.year - b.year || a.week - b.week)
  return allMatchups
}
