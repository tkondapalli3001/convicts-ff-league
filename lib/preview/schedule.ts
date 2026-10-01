// The regular-season schedule: every week's pairings — the loaded weeks plus
// the rest of a live season, which Sleeper publishes up front.

import type { ScheduleGame } from './playoff-odds'
import type { LeagueState, SleeperMatchup } from '@/types'

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
