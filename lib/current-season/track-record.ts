// The forecasts' track record: replay a finished season week by week, using
// only what was known before each week (earlier seasons and the weeks already
// played), and score what the season tab would have shown against what
// happened. Playoff odds get Brier score, log loss and a calibration table
// against three baselines; the Oberon power rankings get a pick rate on the
// next week's games against picking by record or by scoring average.
// npm run dataset runs it for every snapshotted season.

import type { Matchup } from '@/types'
import { computePowerRankings } from '@/lib/stats'
import { fitScoringModel, hashSeed, simulatePlayoffOdds, type ScoringModel, type TeamResults } from './playoff-odds'

/** One regular-season game, both scores final. */
export interface ReplayGame {
  week: number
  a: string
  b: string
  ptsA: number
  ptsB: number
}

export const FORECASTERS = ['odds', 'recordOnly', 'pointsOnly', 'baseRate'] as const
export type Forecaster = (typeof FORECASTERS)[number]

/** One team's playoff chances entering one week, by each forecaster. */
export interface OddsForecast extends Record<Forecaster, number> {
  season: number
  week: number
  team: string
  /** Made the playoffs (1) or not (0). */
  made: 0 | 1
}

export const PICKERS = ['oberon', 'record', 'average'] as const
export type Picker = (typeof PICKERS)[number]

/** One game's pick by each ranking, entering its week: 1 right, 0 wrong, ½ a toss-up or tie. */
export interface GamePick extends Record<Picker, number> {
  season: number
  week: number
  a: string
  b: string
}

/**
 * Replays a season. `history` holds earlier seasons' regular-season scores;
 * `made` the teams that made the playoffs. Each week's odds use the same seed
 * the season tab uses, so they're what it would have shown.
 */
export function replaySeason(input: {
  season: number
  games: ReplayGame[]
  history: { season: number; team: string; pts: number }[]
  playoffSpots: number
  made: Set<string>
  sims?: number
}): { odds: OddsForecast[]; picks: GamePick[] } {
  const { season, games, history, playoffSpots, made, sims } = input
  const teams = [...new Set(games.flatMap(g => [g.a, g.b]))].sort()
  const weeks = [...new Set(games.map(g => g.week))].sort((a, b) => a - b)
  const odds: OddsForecast[] = []
  const picks: GamePick[] = []

  for (const week of weeks) {
    const played = games.filter(g => g.week < week)
    const remaining = games.filter(g => g.week >= week).map(g => ({ week: g.week, a: g.a, b: g.b }))
    const scores: Record<string, number[]> = Object.fromEntries(teams.map(t => [t, []]))
    const wins: Record<string, number> = Object.fromEntries(teams.map(t => [t, 0]))
    for (const g of played) {
      scores[g.a].push(g.ptsA)
      scores[g.b].push(g.ptsB)
      wins[g.a] += g.ptsA > g.ptsB ? 1 : g.ptsA === g.ptsB ? 0.5 : 0
      wins[g.b] += g.ptsB > g.ptsA ? 1 : g.ptsA === g.ptsB ? 0.5 : 0
    }
    const deserved = allPlayWins(played)
    const results = (w: Record<string, number>): TeamResults[] =>
      teams.map(t => ({ name: t, wins: w[t] ?? 0, pf: scores[t].reduce((a, b) => a + b, 0), scores: scores[t] }))
    const model = fitScoringModel(
      [...history, ...played.flatMap(g => [{ season, team: g.a, pts: g.ptsA }, { season, team: g.b, pts: g.ptsB }])],
      Object.values(scores).flat(),
    )
    const opts = (m: ScoringModel) => ({ playoffSpots, model: m, focusWeek: week, seed: hashSeed(`${season}-${week}`), sims })
    const official = simulatePlayoffOdds(results(wins), remaining, opts(model)).playoff
    // Record only: every team the same strength. Points only: each record replaced by the wins its points deserved.
    const recordOnly = simulatePlayoffOdds(results(wins), remaining, opts({ ...model, priorGames: 1e9 })).playoff
    const pointsOnly = simulatePlayoffOdds(results(deserved), remaining, opts(model)).playoff
    for (const t of teams) {
      odds.push({ season, week, team: t, odds: official[t], recordOnly: recordOnly[t], pointsOnly: pointsOnly[t], baseRate: playoffSpots / teams.length, made: made.has(t) ? 1 : 0 })
    }

    // Rankings entering the week pick its games
    if (!played.length) continue
    const rows = computePowerRankings(played.map(g => ({ year: season, week: g.week, team1: g.a, team2: g.b, pts1: g.ptsA, pts2: g.ptsB, type: 'R' }) as Matchup), week - 1)
    const by = new Map(rows.map(r => [r.name, r]))
    for (const g of games.filter(x => x.week === week)) {
      const ra = by.get(g.a), rb = by.get(g.b)
      if (!ra || !rb) continue
      const aWon = g.ptsA > g.ptsB ? 1 : g.ptsA < g.ptsB ? 0 : 0.5
      const grade = (sa: number, sb: number) => (sa === sb || aWon === 0.5 ? 0.5 : (sa > sb) === (aWon === 1) ? 1 : 0)
      picks.push({
        season, week, a: g.a, b: g.b,
        oberon: grade(ra.score, rb.score),
        record: grade(ra.winPct, rb.winPct),
        average: grade(ra.avg, rb.avg),
      })
    }
  }
  return { odds, picks }
}

/** Wins each team's points deserved: all-play expected wins, the luck index's measure. */
function allPlayWins(games: ReplayGame[]): Record<string, number> {
  const byWeek: Record<number, { team: string; pts: number }[]> = {}
  for (const g of games) (byWeek[g.week] ??= []).push({ team: g.a, pts: g.ptsA }, { team: g.b, pts: g.ptsB })
  const out: Record<string, number> = {}
  for (const week of Object.values(byWeek)) {
    for (const me of week) {
      const others = week.filter(o => o !== me)
      out[me.team] = (out[me.team] ?? 0) + others.reduce((a, o) => a + (me.pts > o.pts ? 1 : me.pts === o.pts ? 0.5 : 0), 0) / others.length
    }
  }
  return out
}

// ── Scoring ───────────────────────────────────────────────────────────────────

/** Forecasts this sure are scored as this sure: log loss is infinite at 0 or 1. */
const FLOOR = 0.001

export interface ForecastScore {
  n: number
  /** Mean squared error of the probability, 0 best; always 0.25 for a 50% guess. */
  brier: number
  /** Mean −ln(probability given to what happened), 0 best. */
  logLoss: number
}

export function scoreForecasts(rows: { p: number; y: 0 | 1 }[]): ForecastScore {
  const n = rows.length
  if (!n) return { n, brier: 0, logLoss: 0 }
  const brier = rows.reduce((a, r) => a + (r.p - r.y) ** 2, 0) / n
  const logLoss = rows.reduce((a, r) => {
    const p = Math.min(1 - FLOOR, Math.max(FLOOR, r.p))
    return a - Math.log(r.y ? p : 1 - p)
  }, 0) / n
  return { n, brier, logLoss }
}

export interface CalibrationBin {
  /** Forecasts from `from` up to (not including) `to`; the last bin includes 1. */
  from: number
  to: number
  n: number
  /** Average forecast in the bin. */
  forecast: number
  /** Share that made the playoffs. */
  observed: number
}

/** Ten bins: does a 30% forecast come true about 30% of the time? */
export function calibration(rows: { p: number; y: 0 | 1 }[]): CalibrationBin[] {
  return Array.from({ length: 10 }, (_, i) => {
    const from = i / 10, to = (i + 1) / 10
    const inBin = rows.filter(r => r.p >= from && (i === 9 ? r.p <= to : r.p < to))
    const n = inBin.length
    return {
      from, to, n,
      forecast: n ? inBin.reduce((a, r) => a + r.p, 0) / n : 0,
      observed: n ? inBin.reduce((a, r) => a + r.y, 0) / n : 0,
    }
  })
}

/** The published summary (public/data/track-record.json). */
export interface TrackRecord {
  seasons: number[]
  /** Every forecast, and those made before the final three regular-season weeks (still-open races). */
  odds: Record<'all' | 'early', Record<Forecaster, ForecastScore>>
  calibration: CalibrationBin[]
  /** Each season's Brier score for the official odds and the base rate. */
  bySeason: { season: number; odds: number; baseRate: number; median: boolean }[]
  /** Share of games each ranking picked right (toss-ups count ½). */
  picks: Record<Picker, { n: number; rate: number }>
}

export function summarizeTrackRecord(odds: OddsForecast[], picks: GamePick[], medianSeasons: Set<number>, lastWeek: Record<number, number>): TrackRecord {
  const seasons = [...new Set(odds.map(o => o.season))].sort((a, b) => a - b)
  const early = odds.filter(o => o.week <= lastWeek[o.season] - 3)
  const score = (rows: OddsForecast[]) =>
    Object.fromEntries(FORECASTERS.map(f => [f, scoreForecasts(rows.map(r => ({ p: r[f], y: r.made })))])) as Record<Forecaster, ForecastScore>
  return {
    seasons,
    odds: { all: score(odds), early: score(early) },
    calibration: calibration(odds.map(r => ({ p: r.odds, y: r.made }))),
    bySeason: seasons.map(season => {
      const rows = odds.filter(o => o.season === season)
      return {
        season,
        odds: scoreForecasts(rows.map(r => ({ p: r.odds, y: r.made }))).brier,
        baseRate: scoreForecasts(rows.map(r => ({ p: r.baseRate, y: r.made }))).brier,
        median: medianSeasons.has(season),
      }
    }),
    picks: Object.fromEntries(PICKERS.map(k => [k, { n: picks.length, rate: picks.length ? picks.reduce((a, p) => a + p[k], 0) / picks.length : 0 }])) as TrackRecord['picks'],
  }
}
