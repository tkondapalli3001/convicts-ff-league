// The season tab's playoff odds, entering any week, and the line they draw
// across the season. Both run the same function, so every point on the chart
// is what the tab showed (or would have shown) entering that week.

import type { Matchup } from '@/types'
import { computeStandings } from './build-preview'
import { fitScoringModel, type ScheduleGame, type TeamResults } from './playoff-odds'
import { weekStakes, type TeamStakes } from './stakes'
import type { PlayoffStatus } from './playoff-scenarios'

/** One regular-season team score from a finished season: how scores behave week to week. */
export interface HistoryScore {
  season: number
  team: string
  pts: number
}

interface SeasonInput {
  season: number
  /** Games already final, any week. */
  finalGames: Matchup[]
  /** Every regular-season pairing, week → games, played or not. */
  schedule: Record<number, ScheduleGame[]>
  history: HistoryScore[]
  playoffSpots: number
  /** Last regular-season week. */
  regEnd: number
  /** Every team in the league, so a team without a game yet still counts. */
  teamNames: string[]
}

/**
 * Playoff odds and exact clinch/elimination entering `week`, from the final
 * games before it. Empty unless the whole rest of the schedule is known: a
 * partial one would understate every race.
 */
export function stakesEntering(input: SeasonInput & { week: number }): Record<string, TeamStakes> {
  const { season, week, finalGames, schedule, history, playoffSpots, regEnd, teamNames } = input
  for (let w = week; w <= regEnd; w++) if (!schedule[w]?.length) return {}

  const priorGames = finalGames.filter(m => m.week < week)
  const remaining = Object.values(schedule).flat().filter(g => g.week >= week)
  const standings = computeStandings(priorGames)
  const scores: Record<string, number[]> = {}
  for (const g of priorGames) {
    if (g.type !== 'R') continue
    ;(scores[g.team1] ??= []).push(g.pts1)
    ;(scores[g.team2] ??= []).push(g.pts2)
  }
  const names = new Set([...teamNames, ...remaining.flatMap(g => [g.a, g.b])])
  const teams: TeamResults[] = [...names].map(name => {
    const row = standings.find(r => r.name === name)
    return { name, wins: row?.wins ?? 0, pf: row?.pf ?? 0, scores: scores[name] ?? [] }
  })
  const model = fitScoringModel(history, Object.values(scores).flat())
  return weekStakes({ teams, schedule: remaining, week, playoffSpots, model, seedKey: `${season}-${week}` })
}

export interface WeekOdds {
  week: number
  /** Team → chance of making the playoffs entering the week; 1 or 0 once clinched or eliminated. */
  odds: Record<string, number>
  /** Clinched and eliminated are exact; alive is a simulation. */
  status: Record<string, PlayoffStatus>
}

/** Each team's playoff odds entering every week from 1 through `throughWeek` (capped at the regular season). */
export function oddsByWeek(input: SeasonInput & { throughWeek: number }): WeekOdds[] {
  const out: WeekOdds[] = []
  for (let week = 1; week <= Math.min(input.throughWeek, input.regEnd); week++) {
    const stakes = stakesEntering({ ...input, week })
    if (!Object.keys(stakes).length) return []
    const teams = Object.entries(stakes)
    out.push({ week, odds: Object.fromEntries(teams.map(([t, s]) => [t, s.odds])), status: Object.fromEntries(teams.map(([t, s]) => [t, s.status])) })
  }
  return out
}
