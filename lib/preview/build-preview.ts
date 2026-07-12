import { h2hRecord, type H2HRecord } from '@/lib/stats'
import { flattenSeasonMatchups } from '@/lib/data-processing'
import type { LeagueState, Matchup } from '@/types'

export interface TeamPreview {
  name: string
  rosterId: number
  wins: number
  losses: number
  avgPts: number
  /** This season's played scores, most recent first. */
  lastScores: number[]
  /** Current season streak across all played games, e.g. { type: 'W', len: 3 }. */
  streak: { type: 'W' | 'L'; len: number } | null
  /** Standing position (1-based) through the week before this one; 0 pre-season. */
  seed: number
}

export interface MatchupPreview {
  year: number
  week: number
  isPlayoff: boolean
  /** True once the game has actual scores. */
  played: boolean
  ptsA: number
  ptsB: number
  teamA: TeamPreview
  teamB: TeamPreview
  /** Career head-to-head from teamA's perspective, excluding this week's game. */
  h2h: H2HRecord
}

/** Latest season that has any matchup pairings at all (played or upcoming). */
export function getPreviewSeason(state: LeagueState): number | null {
  const years = Object.keys(state.matchups).map(Number).sort((a, b) => b - a)
  for (const year of years) {
    const weeks = state.matchups[year]
    if (Object.values(weeks).some(w => w.matchups.length > 0)) return year
  }
  return null
}

/** Weeks of a season that have pairings, ascending. */
export function getSeasonWeeks(state: LeagueState, year: number): number[] {
  const weeks = state.matchups[year] ?? {}
  return Object.entries(weeks)
    .filter(([, w]) => w.matchups.length > 0)
    .map(([w]) => Number(w))
    .sort((a, b) => a - b)
}

/**
 * Default week to open on: the first upcoming week with pairings if the
 * season is live, otherwise the last played week.
 */
export function getDefaultWeek(state: LeagueState, year: number): number {
  const weeks = getSeasonWeeks(state, year)
  if (!weeks.length) return 1
  // Flattened from raw weekly data — allMatchups only holds completed
  // seasons, and the preview season is usually the live one
  const played = flattenSeasonMatchups(state, year)
    .filter(m => m.pts1 > 0 || m.pts2 > 0)
    .map(m => m.week)
  const lastPlayed = played.length ? Math.max(...played) : 0
  const upcoming = weeks.find(w => w > lastPlayed)
  return upcoming ?? lastPlayed
}

function isPlayed(m: Matchup): boolean {
  return m.pts1 > 0 || m.pts2 > 0
}

/** Regular-season standings order through the given games: wins desc, PF tiebreak. */
export function computeStandings(priorGames: Matchup[]): { name: string; wins: number; losses: number; pf: number }[] {
  const table: Record<string, { name: string; wins: number; losses: number; pf: number }> = {}
  const row = (name: string) => (table[name] ??= { name, wins: 0, losses: 0, pf: 0 })

  for (const g of priorGames) {
    if (g.type !== 'R' || !isPlayed(g)) continue
    row(g.team1).pf += g.pts1
    row(g.team2).pf += g.pts2
    row(g.winner).wins += 1
    row(g.loser).losses += 1
  }

  return Object.values(table).sort((a, b) => b.wins - a.wins || b.pf - a.pf)
}

function buildTeam(name: string, rosterId: number, priorGames: Matchup[], standings: { name: string }[]): TeamPreview {
  const mine = priorGames
    .filter(g => isPlayed(g) && (g.team1 === name || g.team2 === name))
    .sort((a, b) => b.week - a.week)

  const reg = mine.filter(g => g.type === 'R')
  const wins = reg.filter(g => g.winner === name).length
  const losses = reg.length - wins

  const scores = mine.map(g => (g.team1 === name ? g.pts1 : g.pts2))
  const avgPts = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0

  let streak: TeamPreview['streak'] = null
  if (mine.length) {
    const type: 'W' | 'L' = mine[0].winner === name ? 'W' : 'L'
    let len = 0
    for (const g of mine) {
      if ((g.winner === name) === (type === 'W')) len++
      else break
    }
    streak = { type, len }
  }

  const seed = standings.findIndex(s => s.name === name) + 1

  return { name, rosterId, wins, losses, avgPts, lastScores: scores, streak, seed }
}

/** Build preview cards for one week of a season. */
export function buildWeekPreviews(state: LeagueState, year: number, week: number): MatchupPreview[] {
  // The preview season is usually live and therefore absent from allMatchups
  // (completed seasons only) — flatten it from the raw weekly data
  const seasonGames = flattenSeasonMatchups(state, year)
  const games = seasonGames.filter(m => m.week === week)
  if (!games.length) return []

  const priorGames = seasonGames.filter(m => m.week < week)
  const standings = computeStandings(priorGames)
  const isPlayoff = state.matchups[year]?.[week]?.isPlayoff ?? false

  // Career H2H excludes this week's own game and never-played pairings.
  // Completed seasons come from allMatchups; the preview season's own games
  // are added from the flattened set (no overlap — allMatchups excludes it
  // while live, and we drop the year before concatenating when it's not).
  const h2hPool = [
    ...state.allMatchups.filter(m => m.year !== year),
    ...seasonGames.filter(m => m.week !== week),
  ].filter(isPlayed)

  return games.map(g => ({
    year,
    week,
    isPlayoff,
    played: isPlayed(g),
    ptsA: g.pts1,
    ptsB: g.pts2,
    teamA: buildTeam(g.team1, g.roster1, priorGames, standings),
    teamB: buildTeam(g.team2, g.roster2, priorGames, standings),
    h2h: h2hRecord(h2hPool, g.team1, g.team2),
  }))
}
