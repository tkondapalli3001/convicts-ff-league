// The live season on the 2026 tab. LeagueContext loads once and never
// refetches; the 2026 tab polls the few Sleeper endpoints that change during
// a week (useLiveSeason) and overlays them on the global state here, so every
// pure function downstream (previews, standings, power rankings, rosters)
// runs unchanged on fresher data.

import { isSeasonComplete } from '@/lib/data-processing'
import { fetchLeague, fetchRosters, fetchMatchupsForWeek, fetchTransactions } from '@/lib/sleeper-api'
import type { LeagueState, SleeperLeague, SleeperRoster, SleeperMatchup, Transaction } from '@/types'

export interface LiveOverlay {
  league: SleeperLeague | null
  rosters: SleeperRoster[] | null
  /** week → fresh matchup rows (lineups + live points) */
  matchups: Record<number, SleeperMatchup[]>
  /** The current week's waiver, free-agent, and trade activity. */
  transactions: Transaction[]
}

export const EMPTY_OVERLAY: LiveOverlay = { league: null, rosters: null, matchups: {}, transactions: [] }

/** The newest league in the chain while it's still being played; null otherwise. */
export function liveSeasonEntry(state: LeagueState): { id: string; year: number } | null {
  const newest = state.leagueChain[state.leagueChain.length - 1]
  if (!newest) return null
  const league = state.leagues[newest.year]
  if (!league || isSeasonComplete(league)) return null
  if (league.status === 'pre_draft' || league.status === 'drafting') return null
  return { id: newest.id, year: newest.year }
}

/**
 * One sync pass, returning the next overlay. `full` also refreshes the league,
 * rosters, and transactions — Sleeper's CDN refreshes those every 5 minutes vs
 * every minute for matchups. Always re-reads the current week; also backfills
 * weeks the base state lacks (page left open across a week boundary) and
 * re-reads a week the moment it goes final, to pick up settled scores.
 */
export async function syncLiveSeason(
  leagueId: string,
  year: number,
  base: LeagueState,
  prev: LiveOverlay,
  full: boolean,
): Promise<LiveOverlay> {
  const prevLeague = prev.league ?? base.leagues[year]
  const league = full || !prevLeague ? await fetchLeague(leagueId) : prevLeague
  const week = league.settings?.leg || 1

  const [rosters, transactions] = full || !prev.rosters
    ? await Promise.all([
        fetchRosters(leagueId),
        fetchTransactions(leagueId, week).catch(() => prev.transactions),
      ])
    : [prev.rosters, prev.transactions]

  const have = base.matchups[year] ?? {}
  const weeks = new Set([week])
  for (let w = 1; w < week; w++) {
    if (!have[w]?.matchups.length && !prev.matchups[w]) weeks.add(w)
  }
  const finalNow = league.settings?.last_scored_leg
  if (finalNow && finalNow !== prevLeague?.settings?.last_scored_leg) weeks.add(finalNow)

  const fetched = await Promise.all(
    [...weeks].map(w => fetchMatchupsForWeek(leagueId, w).then(rows => [w, rows] as const))
  )
  return { league, rosters, transactions, matchups: { ...prev.matchups, ...Object.fromEntries(fetched) } }
}

/** Global state with the live overlay applied to one season. */
export function withLiveSeason(state: LeagueState, year: number, live: LiveOverlay): LeagueState {
  const league = live.league ?? state.leagues[year]
  if (!league) return state
  const regWeeks = league.settings?.playoff_week_start > 0 ? league.settings.playoff_week_start : 15

  const weeks = { ...state.matchups[year] }
  for (const [w, rows] of Object.entries(live.matchups)) {
    const week = Number(w)
    weeks[week] = { matchups: rows, isPlayoff: week >= regWeeks }
  }

  return {
    ...state,
    leagues: { ...state.leagues, [year]: league },
    rosters: live.rosters ? { ...state.rosters, [year]: live.rosters } : state.rosters,
    matchups: { ...state.matchups, [year]: weeks },
  }
}

export type WeekStatus = 'final' | 'live' | 'upcoming'

/** Last week of a season with final scores (every week, once the season is complete). */
export function lastFinalWeek(state: LeagueState, year: number): number {
  const league = state.leagues[year]
  const weeks = Object.keys(state.matchups[year] ?? {}).map(Number)
  const lastWeek = weeks.length ? Math.max(...weeks) : 0
  if (isSeasonComplete(league)) return lastWeek
  const s = league?.settings
  return Math.min(lastWeek, s?.last_scored_leg ?? Math.max(0, (s?.leg ?? 1) - 1))
}

/**
 * Final once Sleeper has scored the week, live while any points are on the
 * board, upcoming before kickoff. Points alone can't tell final from live — a
 * Thursday game puts points on the board for the whole week.
 */
export function weekStatus(state: LeagueState, year: number, week: number): WeekStatus {
  if (week <= lastFinalWeek(state, year)) return 'final'
  const rows = state.matchups[year]?.[week]?.matchups ?? []
  return rows.some(m => (m.points ?? 0) > 0) ? 'live' : 'upcoming'
}
