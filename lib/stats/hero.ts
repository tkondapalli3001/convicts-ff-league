import type { LeagueState } from '@/types'
import { getChampion, getRunnerUp, getShameLoser } from '@/lib/utils'
import { buildCareerStats } from './career'

export interface HomeHero {
  champName: string
  runnerUpName: string
  shameName: string
  /** Season number, e.g. 7 → "Season 7 Champion". */
  seasonCount: number
  /** The reigning champion's season, e.g. 2025 → kicker date + ghost "25" numeral. */
  latestYear: number | null
  totalGames: number
  managerCount: number
  yearRange: string
}

/**
 * Home's hero: the reigning champion, runner-up and toilet bowl, and the
 * archive's size. The build runs it on the snapshot so the hero paints at
 * once; the page runs it again on the loaded store.
 */
export function homeHero(state: LeagueState): HomeHero {
  const { years, allMatchups, leagueChain } = state

  // The latest year with a decided title. During pre-draft/in-season the
  // newest year has no bracket yet, so walk backward.
  let champYear: number | null = null
  for (let i = years.length - 1; i >= 0; i--) {
    if (getChampion(years[i], state).winner !== '—') { champYear = years[i]; break }
  }

  return {
    champName: champYear ? getChampion(champYear, state).winner : 'TBD',
    runnerUpName: champYear ? getRunnerUp(champYear, state).name : '—',
    shameName: champYear ? getShameLoser(champYear, state).loser : '—',
    seasonCount: champYear ? years.indexOf(champYear) + 1 : leagueChain.length,
    latestYear: champYear,
    totalGames: allMatchups.length,
    managerCount: buildCareerStats(state).length,
    yearRange: years.length >= 2 ? `${years[0]}–${years[years.length - 1]}` : String(years[0] ?? ''),
  }
}
