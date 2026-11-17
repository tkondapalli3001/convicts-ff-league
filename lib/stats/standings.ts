import type { LeagueState } from '@/types'
import { computeLuckIndex } from './luck'

export interface StandingsSeason {
  manager: string
  year: number
  finish: number | null
  wins: number
  losses: number
  pf: number
  pa: number
  playoffs: boolean
  /** The season's Luck Index (lib/stats/luck.ts). */
  luck: number
}

export interface StandingsData {
  /** Completed seasons, oldest first: the year filters. */
  years: number[]
  seasons: StandingsSeason[]
}

/**
 * Seasons → Standings: every owner-season of the completed years with its luck.
 * The build runs it on the snapshot (so the tab is in the HTML) and the page
 * reruns it on the loaded store.
 */
export function seasonStandings({ ownerSeasons, years, matchups, rosterUserMaps }: LeagueState): StandingsData {
  const luck: Record<string, number> = {}
  for (const year of years) {
    for (const e of computeLuckIndex(matchups, rosterUserMaps, year)) luck[`${e.owner}:${year}`] = e.luckIndex
  }
  const done = new Set(years)
  const seasons: StandingsSeason[] = []
  for (const [manager, list] of Object.entries(ownerSeasons)) {
    for (const s of list) {
      if (!done.has(s.year)) continue
      seasons.push({
        manager, year: s.year, finish: s.finish, wins: s.wins, losses: s.losses, pf: s.pf, pa: s.pa,
        playoffs: s.inPlayoffs, luck: luck[`${manager}:${s.year}`] ?? 0,
      })
    }
  }
  return { years, seasons }
}
