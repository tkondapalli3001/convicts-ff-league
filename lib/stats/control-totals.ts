// Tie-outs, like a month-end close. Two checks, each against a source the
// site doesn't control:
//  - season totals: the site's record, points for and against, and potential
//    points (best possible lineup) against the totals Sleeper stores on every
//    roster;
//  - player and team-defense points: Sleeper's weekly scores against the
//    NFL's box scores (nflverse), rescored with the league's own settings.
// Every difference must be listed below with its cause, or the tests fail.

import type { LeagueState } from '@/types'
import type { SnapshotSeason } from '@/lib/sources'
import { buildOwnerSeasons, playoffStartWeek, resolveOwnerName } from '@/lib/data-processing'
import { bestLineup, startingSlots } from './lineups'

export type ControlMetric = 'record' | 'pf' | 'pa' | 'ppts'

export interface ControlTotal {
  season: number
  owner: string
  rosterId: number
  metric: ControlMetric
  /** Ours, from the site's own code; records read "W-L-T". */
  ours: string
  sleeper: string
  /** Ours minus Sleeper's, for the point totals. */
  diff: number | null
  ties: boolean
}

/** Sleeper adds unrounded weekly scores; ours are stored to the cent, so a one-cent difference is rounding. */
const CENT = 0.015

// ── Why totals differ ─────────────────────────────────────────────────────────
const STALE_2019 =
  "Sleeper's stored 2019 totals match the NFL's box scores; its weekly 2019 scores today don't. They differ " +
  'in the team-defense weeks in KNOWN_DEFENSE_GAPS (mostly special-teams recoveries and return touchdowns ' +
  'Sleeper now scores differently) and in its two 2019 kicker errors (5.6 points each). Those account for ' +
  "every 2019 gap but a few tenths of a point and three larger leftovers: Daniyaal's points against (2.00), " +
  "Teja's points against (2.70) and Armaan's potential points (2.90)."
const STALE_BENCH =
  'Points for and against tie, so every starter is right; Sleeper totaled potential points before a ' +
  "bench player's weekly score changed. Today's offense and kicker scores match the NFL's box scores."
const STALE_2021 =
  'A small revision after Sleeper totaled the season: 0.10 is one yard, 2.00 a two-point play or a ' +
  "fumble. Today's weekly scores match the NFL's box scores (one documented one-yard difference aside)."
const TAYSOM =
  "Unexplained. It all comes from week 11, Taysom Hill's 37.52 points on the bench: Sleeper's total ties " +
  'to the cent if he counted only at QB that week, yet its weekly records list him as a TE.'

/** Every season total that doesn't tie, "season owner metric": our total minus Sleeper's, and why. */
export const KNOWN_GAPS: Record<string, { diff: number; cause: string }> = Object.fromEntries([
  ...([
    ['Dustin pf', 9.6], ['Dustin pa', -1.9], ['Dustin ppts', 11.6], ['Sonu pa', 7],
    ['Nathan pf', 10], ['Nathan pa', 11.6], ['Nathan ppts', 10], ['Raghav pf', 6.3], ['Raghav pa', 9.6],
    ['Raghav ppts', 6.3], ['Teja pf', 10], ['Teja pa', 3.3], ['Teja ppts', 10], ['Armaan pf', 4.1],
    ['Armaan pa', -6], ['Armaan ppts', 7.1], ['Sangram pa', 10], ['Hamza pf', 13.6], ['Hamza pa', -0.14],
    ['Hamza ppts', 13.6], ['Daniyaal pf', -8.14], ['Daniyaal pa', 6], ['Daniyaal ppts', -8.14],
    ['Manu pf', 2], ['Manu pa', 8], ['Manu ppts', 1.8],
  ] as const).map(([k, diff]) => [`2019 ${k}`, { diff, cause: STALE_2019 }]),
  ['2020 Hamza ppts', { diff: 17.38, cause: STALE_BENCH }],
  ['2020 Manu ppts', { diff: 3.7, cause: STALE_BENCH }],
  ...([
    ['Dustin pa', 2], ['Sonu ppts', -4.48], ['Eric pf', -0.1], ['Eric ppts', -2.8], ['Daniyaal ppts', -2.8],
    ['Manu pf', 2], ['Manu pa', -0.1], ['Manu ppts', 1],
  ] as const).map(([k, diff]) => [`2021 ${k}`, { diff, cause: STALE_2021 }]),
  ['2024 Dustin ppts', { diff: 18.36, cause: TAYSOM }],
])

/** Head-to-head plus league-median results (2024), rebuilt from the week's scores. */
function medianResults(season: SnapshotSeason, regularWeeks: number[]): Record<number, { w: number; l: number; t: number }> {
  const out: Record<number, { w: number; l: number; t: number }> = {}
  for (const week of regularWeeks) {
    const rows = season.matchupsByWeek[week] ?? []
    const pts = rows.map(m => m.points).sort((a, b) => b - a)
    const half = pts.length / 2
    const above = pts[half - 1], below = pts[half]
    for (const m of rows) {
      const r = (out[m.roster_id] ??= { w: 0, l: 0, t: 0 })
      if (m.points > below && m.points >= above) r.w++
      else if (m.points < above && m.points <= below) r.l++
      else r.t++
    }
  }
  return out
}

/**
 * One season's control totals. `positions` maps player_id → the positions
 * the player may fill (Sleeper's fantasy_positions); team defenses are DEF.
 */
export function seasonControlTotals(season: SnapshotSeason, positions: Record<string, string[]>): ControlTotal[] {
  const year = season.year
  const users = new Map(season.users.map(u => [u.user_id, u]))
  const rMap: Record<string, string> = {}
  for (const r of season.rosters) {
    const u = users.get(r.owner_id)
    rMap[String(r.roster_id)] = u ? resolveOwnerName(u.user_id, u.display_name) : `Team ${r.roster_id}`
  }

  const playoffStart = playoffStartWeek(season.league)
  const weeks = Object.keys(season.matchupsByWeek).map(Number).sort((a, b) => a - b)
  const regularWeeks = weeks.filter(w => w < playoffStart)
  const state = {
    leagues: { [year]: season.league },
    rosterUserMaps: { [year]: rMap },
    matchups: { [year]: Object.fromEntries(weeks.map(w => [w, { matchups: season.matchupsByWeek[w], isPlayoff: w >= playoffStart }])) },
    brackets: { [year]: { winners: season.winnersBracket, losers: season.losersBracket } },
  } as unknown as LeagueState
  const ownerSeasons = buildOwnerSeasons(state)
  const median = season.league.settings.league_average_match ? medianResults(season, regularWeeks) : null

  const slots = startingSlots(season.league.roster_positions ?? [])
  const eligible = (id: string) => (/^[A-Z]{2,3}$/.test(id) ? ['DEF'] : positions[id] ?? [])
  const potential: Record<number, number> = {}
  for (const week of regularWeeks) {
    for (const m of season.matchupsByWeek[week] ?? []) {
      const players = (m.players ?? []).map(id => ({ id, positions: eligible(id), points: m.players_points?.[id] ?? 0 }))
      potential[m.roster_id] = (potential[m.roster_id] ?? 0) + bestLineup(slots, players).points
    }
  }

  const out: ControlTotal[] = []
  for (const r of season.rosters) {
    const owner = rMap[String(r.roster_id)]
    const ours = ownerSeasons[owner]?.find(s => s.year === year)
    const st = r.settings
    const row = (metric: ControlMetric, mine: number, theirs: number) => {
      const diff = mine - theirs
      out.push({ season: year, owner, rosterId: r.roster_id, metric, ours: mine.toFixed(2), sleeper: theirs.toFixed(2), diff, ties: Math.abs(diff) < CENT })
    }

    const m = median?.[r.roster_id]
    const w = (ours?.wins ?? 0) + (m?.w ?? 0), l = (ours?.losses ?? 0) + (m?.l ?? 0), t = (ours?.ties ?? 0) + (m?.t ?? 0)
    const sleeperRecord = `${st.wins ?? 0}-${st.losses ?? 0}-${st.ties ?? 0}`
    out.push({ season: year, owner, rosterId: r.roster_id, metric: 'record', ours: `${w}-${l}-${t}`, sleeper: sleeperRecord, diff: null, ties: `${w}-${l}-${t}` === sleeperRecord })

    row('pf', ours?.pf ?? 0, (st.fpts ?? 0) + (st.fpts_decimal ?? 0) / 100)
    row('pa', ours?.pa ?? 0, (st.fpts_against ?? 0) + (st.fpts_against_decimal ?? 0) / 100)
    row('ppts', potential[r.roster_id] ?? 0, (st.ppts ?? 0) + (st.ppts_decimal ?? 0) / 100)
  }
  return out
}

export const gapKey = (t: Pick<ControlTotal, 'season' | 'owner' | 'metric'>) => `${t.season} ${t.owner} ${t.metric}`

/** Why a total doesn't tie, from KNOWN_GAPS; null when it ties or the gap is new. */
export function gapCause(t: ControlTotal): string | null {
  return t.ties ? null : KNOWN_GAPS[gapKey(t)]?.cause ?? null
}

// ── Why a player's points differ ──────────────────────────────────────────────
const PHANTOM_FG =
  "Sleeper's own 2019 stat line has a made field goal that didn't happen, worth 5.6 points (4 for 40-49 " +
  "yards plus 0.1 a yard over 30). Its line shows one attempt, both made and missed; nflverse has the one miss."
const DOUBLE_FG =
  "Sleeper's own 2019 stat line counts his 58-yard field goal in both the 40-49 and 50+ buckets, plus 16 " +
  'yards that never happened: 5.6 extra points.'
const ST_FUMBLE =
  'Recovered a fumble on special teams, which the league scores (2 points); nflverse does not say which ' +
  'recoveries came on special teams, so the rescore leaves recoveries out.'

/** Every rostered player-week whose rescored nflverse points differ from Sleeper's, "season week player_id": nflverse minus Sleeper, and why. */
export const KNOWN_PLAYER_GAPS: Record<string, { diff: number; cause: string }> = {
  '2019 2 2747': { diff: -5.6, cause: PHANTOM_FG },                       // Jason Myers
  '2019 4 1266': { diff: -5.6, cause: DOUBLE_FG },                        // Greg Zuerlein
  '2019 8 4146': { diff: -2, cause: ST_FUMBLE },                          // Dede Westbrook (own muff on a punt return)
  '2019 14 4157': { diff: -2, cause: ST_FUMBLE },                         // Tarik Cohen (own muff on a punt return)
  '2019 14 4666': { diff: -2, cause: ST_FUMBLE },                         // Younghoe Koo (onside kick)
  '2021 4 3969': { diff: 0.1, cause: 'The sources differ by one yard.' }, // Leonard Fournette
  '2025 6 11560': { diff: 0.5, cause: 'The sources differ on his rushing yards (nflverse +3, Sleeper -2): 5 yards is 0.5 points.' }, // Caleb Williams
}

// ── Why a team defense's points differ ────────────────────────────────────────
const ST_RECOVERY =
  "Sleeper credits special-teams fumble recoveries the NFL's box score doesn't count: a muffed punt or " +
  "kick (either team's), a team falling on its own returner's fumble, or one recovery counted twice."
const OWN_RECOVERY = 'Sleeper credits Cleveland for recovering its own fumble on an interception return.'
const RETURN_TD_2019 =
  "2019: Sleeper left the opponent's kick or punt return touchdown out of points allowed. Since 2020 it " +
  'nearly always counts one against the D/ST, as the rescore does.'
const DEFENSIVE_TD_2019 =
  "2019: Sleeper counted the opponent's interception or fumble return touchdown as points allowed. From " +
  '2020 on it never does, and the rescore leaves them out.'
const BLOCKED_PUNT_TD = "Sleeper credits New England's blocked punt but not the touchdown scored on it."
const BLOCKED_FG = "The play-by-play shows a blocked field goal that Sleeper doesn't credit."
const BOTCHED_PUNT =
  "Ashton Dulin, a receiver, scored on the Rams' botched punt. Sleeper treats it as a defensive touchdown " +
  "and leaves it out of points allowed; the rescore credits fumble-return touchdowns to defenders only."
const YARDS_350 =
  'Chicago allowed 351 yards by the box score and the play-by-play, 348 by Sleeper: either side of the ' +
  '350-yard tier line.'
const SUSPENDED =
  "Bills-Bengals was suspended after Damar Hamlin's collapse, so the NFL has no box score; Sleeper kept " +
  "Buffalo's first-quarter points."

/** Every rostered team-defense week whose rescored points differ from Sleeper's, "season week team": nflverse minus Sleeper, and why. */
export const KNOWN_DEFENSE_GAPS: Record<string, { diff: number; cause: string }> = Object.fromEntries([
  ...([
    ['2019 1 BAL', -2], ['2019 1 SEA', -2], ['2019 2 CAR', -4], ['2019 2 MIN', -2], ['2019 3 JAX', -2],
    ['2019 3 MIN', -2], ['2019 4 IND', -2], ['2019 5 NO', -2], ['2019 5 SF', -2], ['2019 5 TEN', -2],
    ['2019 6 CAR', -2], ['2019 7 LAR', -2], ['2019 7 NE', -2], ['2019 8 BUF', -2], ['2019 8 CAR', -2],
    ['2019 9 IND', -2], ['2019 9 MIN', -4], ['2019 9 NE', -2], ['2019 9 PHI', -2], ['2019 9 PIT', -2],
    ['2019 10 CLE', -2], ['2019 10 PIT', -2], ['2019 11 BAL', -2], ['2019 11 JAX', -2], ['2019 11 MIN', -4],
    ['2019 12 BUF', -2], ['2019 12 NO', -2], ['2019 12 TEN', -2], ['2019 14 CHI', -2], ['2019 15 NE', -2],
    ['2019 15 SF', -2], ['2020 1 NE', -2], ['2020 1 PHI', -2], ['2020 3 NO', -2], ['2020 5 ARI', -2],
    ['2023 2 PHI', -2],
  ] as const).map(([k, diff]) => [k, { diff, cause: ST_RECOVERY }]),
  ['2019 3 SEA', { diff: -2, cause: ST_RECOVERY }], // SEA vs NO: also leaves New Orleans's punt-return TD out of points allowed, in the same tier
  ['2019 4 NE', { diff: 6, cause: BLOCKED_PUNT_TD }], // NE vs BUF
  ['2019 6 BAL', { diff: -2, cause: RETURN_TD_2019 }], // BAL vs CIN: Cincinnati's kickoff return
  ['2019 6 NE', { diff: 6, cause: BLOCKED_PUNT_TD }], // NE vs NYG
  ['2019 7 NO', { diff: -1, cause: RETURN_TD_2019 }], // NO vs CHI: Chicago's kickoff return
  ['2019 11 CAR', { diff: -1, cause: RETURN_TD_2019 }], // CAR vs ATL: Atlanta's punt return
  ['2019 13 SEA', { diff: -1, cause: `${DEFENSIVE_TD_2019} ${ST_RECOVERY}` }], // SEA vs MIN: Minnesota's pick-six
  ['2019 14 HOU', { diff: 4, cause: DEFENSIVE_TD_2019 }], // HOU vs DEN: Denver's fumble return
  ['2019 14 LAR', { diff: 1, cause: DEFENSIVE_TD_2019 }], // LAR vs SEA: Seattle's pick-six
  ['2019 15 LAC', { diff: 4, cause: DEFENSIVE_TD_2019 }], // LAC vs MIN: Minnesota's fumble return
  ['2020 3 CLE', { diff: -2, cause: OWN_RECOVERY }], // CLE vs WAS
  ['2021 2 CLE', { diff: 2, cause: BLOCKED_FG }], // CLE vs HOU
  ['2021 2 LAR', { diff: -1, cause: BOTCHED_PUNT }], // LAR vs IND
  ['2021 4 CHI', { diff: -1, cause: YARDS_350 }], // CHI vs DET
  ['2021 17 TEN', { diff: 2, cause: BLOCKED_FG }], // TEN vs MIA
  ['2022 17 BUF', { diff: -8, cause: SUSPENDED }], // BUF vs CIN
])

export const playerGapKey = (season: number, week: number, playerId: string) => `${season} ${week} ${playerId}`

/** Why a player-week's rescored points differ from Sleeper's; null when it isn't documented. */
export function playerGapCause(season: number, week: number, playerId: string): string | null {
  return KNOWN_PLAYER_GAPS[playerGapKey(season, week, playerId)]?.cause ?? null
}

/** Why a team defense's rescored week differs from Sleeper's; null when it isn't documented. */
export function defenseGapCause(season: number, week: number, team: string): string | null {
  return KNOWN_DEFENSE_GAPS[playerGapKey(season, week, team)]?.cause ?? null
}
