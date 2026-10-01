// Season facts for the 2026 tab's flair, smack talk, and Matchup of the Week.
// Pure extractors — every badge, ammo line, and spotlight reason is built
// from one of these, so all three always agree on the numbers.

import { computePowerRankings, type H2HRecord } from '@/lib/stats'
import { getChampion, getShameLoser } from '@/lib/utils'
import type { LeagueState, Matchup, Transaction } from '@/types'
import type { ProjectedPlayer } from './projections'

// ─── Daddy: owns the all-time series ──────────────────────────────────────────

/** "Daddy": wins at least this share of all-time meetings with the opponent… */
export const DADDY_WIN_RATE = 0.75
/** …over at least this many meetings. */
export const DADDY_MIN_GAMES = 5

export interface DaddyStatus {
  daddy: string
  son: string
  wins: number
  losses: number
  rate: number
}

/** Who has won the last 2+ meetings in a row, and how many (games are newest first). */
export function seriesStreak(h2h: H2HRecord, a: string): { owner: string; len: number } | null {
  if (!h2h.games.length) return null
  const winnerOf = (g: H2HRecord['games'][number]) =>
    (g.team1 === a && g.pts1 >= g.pts2) || (g.team2 === a && g.pts2 >= g.pts1) ? a : (g.team1 === a ? g.team2 : g.team1)
  const owner = winnerOf(h2h.games[0])
  let len = 0
  for (const g of h2h.games) {
    if (winnerOf(g) === owner) len++
    else break
  }
  return len >= 2 ? { owner, len } : null
}

/** The owner who has won 75%+ of 5+ all-time meetings, if either has. */
export function daddyOf(h2h: H2HRecord, a: string, b: string): DaddyStatus | null {
  const total = h2h.winsA + h2h.winsB
  if (total < DADDY_MIN_GAMES) return null
  const aLeads = h2h.winsA >= h2h.winsB
  const wins = aLeads ? h2h.winsA : h2h.winsB
  const rate = wins / total
  if (rate < DADDY_WIN_RATE) return null
  return { daddy: aLeads ? a : b, son: aLeads ? b : a, wins, losses: total - wins, rate }
}

// ─── Last season's honors ─────────────────────────────────────────────────────

export interface SeasonHonors {
  year: number | null
  /** Champion(s) of the last completed season — a shared title lists both. */
  champs: string[]
  /** That season's toilet-bowl loser. */
  toilet: string | null
}

/** Champion and toilet-bowl loser of the last completed season before `year`. */
export function seasonHonors(state: LeagueState, year: number): SeasonHonors {
  const prior = state.years.filter(y => y < year)
  const last = prior.length ? prior[prior.length - 1] : null
  if (last == null) return { year: null, champs: [], toilet: null }
  const champ = getChampion(last, state).winner
  const toilet = getShameLoser(last, state).loser
  return {
    year: last,
    champs: champ && champ !== '—' ? champ.split(/\s*&\s*/) : [],
    toilet: toilet && toilet !== '—' ? toilet : null,
  }
}

// ─── This season so far ───────────────────────────────────────────────────────

export interface PowerRankPoint {
  rank: number
  /** Places gained since the week before; null in week 1. */
  movement: number | null
}

/** Power rank of every team entering a week (final regular-season games only). */
export function powerRanksThrough(games: Matchup[], throughWeek: number): Record<string, PowerRankPoint> {
  if (throughWeek < 1) return {}
  return Object.fromEntries(
    computePowerRankings(games, throughWeek).map(r => [r.name, { rank: r.rank, movement: r.movement }])
  )
}

export interface ScoreMark {
  owner: string
  pts: number
  week: number
}

/** The season's highest and lowest single-week scores among `games`. */
export function seasonExtremes(games: Matchup[]): { high: ScoreMark | null; low: ScoreMark | null } {
  let high: ScoreMark | null = null
  let low: ScoreMark | null = null
  for (const g of games) {
    if (g.pts1 <= 0 && g.pts2 <= 0) continue
    for (const [owner, pts] of [[g.team1, g.pts1], [g.team2, g.pts2]] as const) {
      if (pts <= 0) continue
      if (!high || pts > high.pts) high = { owner, pts, week: g.week }
      if (!low || pts < low.pts) low = { owner, pts, week: g.week }
    }
  }
  return { high, low }
}

/** Positions each lineup slot accepts. */
const SLOT_ELIGIBLE: Record<string, string[]> = {
  QB: ['QB'], RB: ['RB'], WR: ['WR'], TE: ['TE'], K: ['K'], DEF: ['DEF'],
  FLEX: ['RB', 'WR', 'TE'], WRRB_FLEX: ['WR', 'RB'], REC_FLEX: ['WR', 'TE'],
  SUPER_FLEX: ['QB', 'RB', 'WR', 'TE'],
}

export interface LineupRegret {
  benched: { name: string; pts: number }
  /** The starter they should have sat — "an empty slot" if the slot went unfilled. */
  started: { name: string; pts: number }
  /** Points the swap would have added. */
  cost: number
}

/**
 * Per owner: the costliest lineup call of one week — a bench player who
 * outscored a starter in a slot they could have filled. Only true regrets:
 * players on IR and swaps that wouldn't have gained points never count.
 */
export function lineupRegrets(
  state: LeagueState,
  year: number,
  week: number,
  lookup: (id: string) => ProjectedPlayer,
): Record<string, LineupRegret> {
  const slots = (state.leagues[year]?.roster_positions ?? []).filter(s => s !== 'BN' && s !== 'IR' && s !== 'TAXI')
  const rMap = state.rosterUserMaps[year] ?? {}
  const out: Record<string, LineupRegret> = {}
  for (const m of state.matchups[year]?.[week]?.matchups ?? []) {
    if (!m.starters?.length || !m.players_points) continue
    const starters = new Set(m.starters)
    const ir = new Set(state.rosters[year]?.find(r => r.roster_id === m.roster_id)?.reserve ?? [])
    let best: LineupRegret | null = null
    for (let i = 0; i < m.starters.length; i++) {
      const eligible = SLOT_ELIGIBLE[slots[i]]
      if (!eligible) continue
      const sid = m.starters[i]
      const startedPts = m.starters_points?.[i] ?? m.players_points[sid] ?? 0
      for (const pid of m.players ?? []) {
        if (starters.has(pid) || ir.has(pid)) continue
        const benchPts = m.players_points[pid] ?? 0
        const cost = benchPts - startedPts
        if (cost <= (best?.cost ?? 0)) continue
        const bench = lookup(pid)
        if (!eligible.includes(bench.position)) continue
        best = {
          benched: { name: bench.name, pts: benchPts },
          started: { name: !sid || sid === '0' ? 'an empty slot' : lookup(sid).name, pts: startedPts },
          cost,
        }
      }
    }
    if (best) out[rMap[String(m.roster_id)] ?? `Team${m.roster_id}`] = best
  }
  return out
}

/** Career regular-season wins from every completed season before `year`. */
export function careerWinsBefore(state: LeagueState, year: number): Record<string, number> {
  const out: Record<string, number> = {}
  for (const [owner, seasons] of Object.entries(state.ownerSeasons)) {
    out[owner] = seasons.filter(s => s.year < year).reduce((a, s) => a + s.wins, 0)
  }
  return out
}

// ─── This week's lineups and moves ────────────────────────────────────────────

/** Designations that mean a starter won't — or likely won't — play. */
const SIDELINED = new Set(['Out', 'IR', 'Doubtful', 'PUP', 'Sus', 'NA', 'DNR', 'COV'])

export interface InjuryReport {
  sidelined: { name: string; status: string }[]
  questionable: number
}

/** Per owner: starters who are out or doubtful, and how many are questionable. */
export function injuryReport(
  starters: Record<number, string[]>,
  rMap: Record<string, string>,
  lookup: (id: string) => ProjectedPlayer,
): Record<string, InjuryReport> {
  const out: Record<string, InjuryReport> = {}
  for (const [rosterId, ids] of Object.entries(starters)) {
    const report: InjuryReport = { sidelined: [], questionable: 0 }
    for (const id of ids) {
      if (!id || id === '0') continue
      const p = lookup(id)
      if (p.injury && SIDELINED.has(p.injury)) report.sidelined.push({ name: p.name, status: p.injury })
      else if (p.injury === 'Questionable') report.questionable++
    }
    out[rMap[rosterId] ?? `Team${rosterId}`] = report
  }
  return out
}

export interface WeekMoves {
  count: number
  /** Biggest FAAB claim, if any. */
  topBid: { player: string; bid: number } | null
}

/** Per owner: completed adds this week and their biggest FAAB claim. */
export function weeklyMoves(
  transactions: Transaction[],
  rMap: Record<string, string>,
  lookup: (id: string) => ProjectedPlayer,
): Record<string, WeekMoves> {
  const out: Record<string, WeekMoves> = {}
  for (const t of transactions) {
    if (t.status !== 'complete' || t.type === 'trade') continue
    for (const [pid, rid] of Object.entries(t.adds ?? {})) {
      const owner = rMap[String(rid)] ?? `Team${rid}`
      const m = (out[owner] ??= { count: 0, topBid: null })
      m.count++
      const bid = t.settings?.waiver_bid ?? 0
      if (bid > (m.topBid?.bid ?? 0)) m.topBid = { player: lookup(pid).name, bid }
    }
  }
  return out
}
