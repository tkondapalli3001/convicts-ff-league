// The regular-season schedule: every week's pairings (the loaded weeks plus
// the rest of a live season, which Sleeper publishes up front), and each
// owner's season at a glance for the 2026 Rosters tab.

import type { ScheduleGame } from './playoff-odds'
import type { WeekStatus } from './live'
import type { LeagueState, Matchup, SleeperMatchup } from '@/types'

/** Regular-season pairings by week (owner names), from the loaded weeks plus any fetched separately. */
export function seasonSchedule(
  state: LeagueState,
  season: number,
  extra: Record<number, SleeperMatchup[]> = {},
): Record<number, ScheduleGame[]> {
  const rMap = state.rosterUserMaps[season] ?? {}
  const regEnd = (state.leagues[season]?.settings?.playoff_week_start || 15) - 1
  const out: Record<number, ScheduleGame[]> = {}
  for (let week = 1; week <= regEnd; week++) {
    const rows = state.matchups[season]?.[week]?.matchups?.length ? state.matchups[season][week].matchups : extra[week]
    if (!rows?.length) continue
    const groups: Record<number, SleeperMatchup[]> = {}
    for (const m of rows) if (m.matchup_id != null) (groups[m.matchup_id] ??= []).push(m)
    out[week] = Object.values(groups)
      .filter(g => g.length === 2)
      .map(([x, y]) => ({ week, a: rMap[String(x.roster_id)] ?? `Team ${x.roster_id}`, b: rMap[String(y.roster_id)] ?? `Team ${y.roster_id}` }))
  }
  return out
}

/** Regular-season weeks the loaded state has no pairings for (the rest of a live season). */
export function scheduleGaps(state: LeagueState, season: number): number[] {
  const regEnd = (state.leagues[season]?.settings?.playoff_week_start || 15) - 1
  const gaps: number[] = []
  for (let week = 1; week <= regEnd; week++) {
    if (!state.matchups[season]?.[week]?.matchups?.length) gaps.push(week)
  }
  return gaps
}

export interface ScheduleRow {
  week: number
  opponent: string
  status: WeekStatus
  /** Final weeks only. */
  result: 'W' | 'L' | 'T' | null
  /** Final or live scores; null before kickoff. */
  pts: number | null
  oppPts: number | null
  /** Record after this game (final weeks only), e.g. "2–1". */
  record: string | null
  /** The team's season-high or season-low score (needs two final games). */
  mark: 'high' | 'low' | null
}

/**
 * One owner's season week by week: results and running record for final
 * weeks, the score so far for a live week, and the opponent for the rest.
 */
export function ownerSchedule(
  owner: string,
  schedule: Record<number, ScheduleGame[]>,
  games: Matchup[],
  statusOf: (week: number) => WeekStatus,
): ScheduleRow[] {
  const rows: ScheduleRow[] = []
  let w = 0
  let l = 0
  let t = 0
  for (const week of Object.keys(schedule).map(Number).sort((a, b) => a - b)) {
    const pair = schedule[week].find(g => g.a === owner || g.b === owner)
    if (!pair) continue
    const opponent = pair.a === owner ? pair.b : pair.a
    const status = statusOf(week)
    const game = games.find(g => g.week === week && (g.team1 === owner || g.team2 === owner))
    const pts = game && status !== 'upcoming' ? (game.team1 === owner ? game.pts1 : game.pts2) : null
    const oppPts = game && status !== 'upcoming' ? (game.team1 === owner ? game.pts2 : game.pts1) : null
    let result: ScheduleRow['result'] = null
    let record: string | null = null
    if (status === 'final' && pts != null && oppPts != null) {
      result = pts > oppPts ? 'W' : pts < oppPts ? 'L' : 'T'
      if (result === 'W') w++
      else if (result === 'L') l++
      else t++
      record = t ? `${w}–${l}–${t}` : `${w}–${l}`
    }
    rows.push({ week, opponent, status, result, pts, oppPts, record, mark: null })
  }
  const finals = rows.filter(r => r.result && r.pts != null)
  if (finals.length >= 2) {
    const high = finals.reduce((a, b) => (b.pts! > a.pts! ? b : a))
    const low = finals.reduce((a, b) => (b.pts! < a.pts! ? b : a))
    high.mark = 'high'
    if (low !== high) low.mark = 'low'
  }
  return rows
}
