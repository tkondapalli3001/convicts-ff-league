// The wins bridge: where an owner-season's wins came from.
//
// Each regular-season week, the lineup Sleeper's projections would have
// started from the roster splits the team's points two ways:
//  - lineup calls: what the team scored minus what that projected lineup scored;
//  - the projected lineup's points above replacement, by how each player
//    reached the roster (draft, pickups, trades).
// Each part is measured against the league's average that week and converted
// to all-play wins against that week's real scores. The conversion averages
// over every order the parts could be added in (Shapley values), so they sum
// exactly. Luck closes the gap to the actual record: the same all-play and
// luck math as ./luck.ts, which the tie-out tests check.
//
// The parts describe what happened. None of them repeats from one season to
// the next in this league (see partRepeatability), so none is called skill.

import { bestLineup } from './lineups'

export const BRIDGE_PARTS = ['draft', 'pickups', 'trades', 'lineup'] as const
export type BridgePart = (typeof BRIDGE_PARTS)[number]
export type Channel = Exclude<BridgePart, 'lineup'>

/** z for an 80% range around a season's total. */
const Z80 = 1.2816

// ── One team-week ─────────────────────────────────────────────────────────────

/** A rostered player's week, as the bridge reads it. */
export interface BridgePlayer {
  id: string
  /** Every position the player may fill; a team defense is ['DEF']. */
  positions: string[]
  /** Sleeper's final projection, scored with the league's settings (0 if none). */
  projected: number
  /** Points Sleeper credited that week. */
  actual: number
  channel: Channel
}

export interface TeamWeekSplit {
  /** Points scored minus what the projected lineup scored. */
  lineup: number
  /** The projected lineup's points above replacement, by channel. */
  par: Record<Channel, number>
  /** The projected lineup, slot by slot (null when nobody eligible was on the roster). */
  plan: { slot: string; playerId: string | null; par: number }[]
}

/**
 * Splits a team-week's points. An empty slot in the projected lineup counts
 * as a missed pickup: a replacement-level player was free to add.
 */
export function splitTeamWeek(slots: string[], roster: BridgePlayer[], points: number, replacement: Record<string, number>): TeamWeekSplit {
  const best = bestLineup(slots, roster.map(p => ({ id: p.id, positions: p.positions, points: p.projected })))
  const byId = new Map(roster.map(p => [p.id, p]))
  const par: Record<Channel, number> = { draft: 0, pickups: 0, trades: 0 }
  let planned = 0
  const plan = best.slots.map(({ slot, playerId }) => {
    const p = playerId ? byId.get(playerId) : undefined
    const value = (p?.actual ?? 0) - (replacement[slot] ?? 0)
    planned += p?.actual ?? 0
    par[p?.channel ?? 'pickups'] += value
    return { slot, playerId, par: value }
  })
  return { lineup: points - planned, par, plan }
}

/**
 * Replacement level for each starting slot: the per-game points of the three
 * players ranked just past the league's starting demand at each position
 * (teams × slots, plus each position's share of FLEX starts). FLEX takes the
 * best of RB, WR and TE.
 */
export function replacementLevels(
  slots: string[],
  teams: number,
  flexStarts: Partial<Record<string, number>>,
  seasonLines: Record<string, { total: number; games: number }[]>,
): Record<string, number> {
  const flexSlots = slots.filter(s => s === 'FLEX').length
  const flexTotal = Object.values(flexStarts).reduce((a: number, b) => a + (b ?? 0), 0)
  const out: Record<string, number> = {}
  for (const [pos, lines] of Object.entries(seasonLines)) {
    const share = flexTotal ? (flexStarts[pos] ?? 0) / flexTotal : 0
    const demand = Math.floor(teams * (slots.filter(s => s === pos).length + flexSlots * share))
    const tier = [...lines].sort((a, b) => b.total - a.total).slice(demand, demand + 3).filter(l => l.games > 0)
    out[pos] = tier.length ? tier.reduce((a, l) => a + l.total / l.games, 0) / tier.length : 0
  }
  if (flexSlots) out.FLEX = Math.max(out.RB ?? 0, out.WR ?? 0, out.TE ?? 0)
  return out
}

// ── One week, every team ──────────────────────────────────────────────────────

export interface WeekTeam {
  owner: string
  points: number
  /** Head-to-head result ('' if no opponent). */
  result: 'W' | 'L' | 'T' | ''
  split: TeamWeekSplit
}

export interface WeekBridge {
  owner: string
  /** All-play wins of a team scoring the league average. */
  baseline: number
  /** Each part's all-play wins. */
  wins: Record<BridgePart, number>
  /** Each part in points, against the league's average that week. */
  points: Record<BridgePart, number>
  /** All-play expected wins: baseline plus every part. */
  expected: number
  /** Head-to-head wins, a tie counting ½. */
  actual: number
}

const permutations = <T>(xs: readonly T[]): T[][] =>
  xs.length <= 1 ? [xs.slice()] : xs.flatMap((x, i) => permutations([...xs.slice(0, i), ...xs.slice(i + 1)]).map(p => [x, ...p]))
const ORDERS = permutations(BRIDGE_PARTS)

/**
 * One week's bridges. Each team's points must equal a baseline shared by every
 * team plus its parts, which splitTeamWeek guarantees: every team's replacement
 * levels are the same. A team that didn't score sat the week out, as in
 * allPlayRecords.
 */
export function weekBridges(teams: WeekTeam[]): WeekBridge[] {
  const played = teams.filter(t => t.points > 0)
  if (played.length < 2) return []
  const value = (t: WeekTeam, part: BridgePart) => (part === 'lineup' ? t.split.lineup : t.split.par[part])
  const mean = (f: (t: WeekTeam) => number) => played.reduce((a, t) => a + f(t), 0) / played.length
  const average = mean(t => t.points)
  const partMean = Object.fromEntries(BRIDGE_PARTS.map(k => [k, mean(t => value(t, k))])) as Record<BridgePart, number>

  return played.map(t => {
    const others = played.filter(o => o !== t).map(o => o.points)
    // all-play: teams outscored, a tie counting ½ (floating sums compare within a hair)
    const allPlay = (p: number) => others.reduce((a, o) => a + (Math.abs(p - o) <= 1e-9 ? 0.5 : p > o ? 1 : 0), 0) / others.length
    const points = Object.fromEntries(BRIDGE_PARTS.map(k => [k, value(t, k) - partMean[k]])) as Record<BridgePart, number>
    const wins = Object.fromEntries(BRIDGE_PARTS.map(k => [k, 0])) as Record<BridgePart, number>
    for (const order of ORDERS) {
      let p = average
      let e = allPlay(p)
      for (const k of order) {
        p += points[k]
        const next = allPlay(p)
        wins[k] += (next - e) / ORDERS.length
        e = next
      }
    }
    return {
      owner: t.owner,
      baseline: allPlay(average),
      wins,
      points,
      expected: allPlay(t.points),
      actual: t.result === 'W' ? 1 : t.result === 'T' ? 0.5 : 0,
    }
  })
}

// ── A season, and a career ────────────────────────────────────────────────────

export interface BridgeStep {
  wins: number
  /** Standard error from week-to-week spread; the 80% range is wins ± 1.28 × se. */
  se: number
  /** Points against the league average, summed over the season. */
  points: number
}

export interface BridgeTotals {
  weeks: number
  /** All-play wins of a team scoring the league average every week. */
  baseline: number
  parts: Record<BridgePart, BridgeStep>
  /** All-play expected wins (the luck index's), equal to baseline plus the parts. */
  expected: number
  /** Head-to-head wins, ties ½. */
  actual: number
  /** actual − expected: the luck index. */
  luck: number
}

/** Sums one owner's weeks into a season. */
export function seasonTotals(weeks: WeekBridge[]): BridgeTotals {
  const sum = (f: (w: WeekBridge) => number) => weeks.reduce((a, w) => a + f(w), 0)
  const parts = Object.fromEntries(BRIDGE_PARTS.map(k => {
    const xs = weeks.map(w => w.wins[k])
    const m = xs.reduce((a, b) => a + b, 0) / (xs.length || 1)
    const sd = Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length || 1))
    return [k, { wins: sum(w => w.wins[k]), se: sd * Math.sqrt(xs.length), points: sum(w => w.points[k]) }]
  })) as Record<BridgePart, BridgeStep>
  const expected = sum(w => w.expected), actual = sum(w => w.actual)
  return { weeks: weeks.length, baseline: sum(w => w.baseline), parts, expected, actual, luck: actual - expected }
}

/** Adds seasons into a career: wins and points add, standard errors add in quadrature. */
export function careerTotals(seasons: BridgeTotals[]): BridgeTotals {
  const sum = (f: (s: BridgeTotals) => number) => seasons.reduce((a, s) => a + f(s), 0)
  const parts = Object.fromEntries(BRIDGE_PARTS.map(k => [k, {
    wins: sum(s => s.parts[k].wins),
    se: Math.sqrt(sum(s => s.parts[k].se ** 2)),
    points: sum(s => s.parts[k].points),
  }])) as Record<BridgePart, BridgeStep>
  const expected = sum(s => s.expected), actual = sum(s => s.actual)
  return { weeks: sum(s => s.weeks), baseline: sum(s => s.baseline), parts, expected, actual, luck: actual - expected }
}

/** The 80% range of a step. */
export const stepRange = (s: BridgeStep): [number, number] => [s.wins - Z80 * s.se, s.wins + Z80 * s.se]

/**
 * Does each part repeat? The correlation between an owner's value one season
 * and the next (Pearson r over every consecutive pair of seasons).
 */
export function partRepeatability(seasons: { owner: string; season: number; totals: BridgeTotals }[]): Record<BridgePart | 'luck', { r: number; pairs: number }> {
  const by = new Map(seasons.map(s => [`${s.owner}:${s.season}`, s.totals]))
  const keys = [...BRIDGE_PARTS, 'luck'] as const
  return Object.fromEntries(keys.map(k => {
    const get = (t: BridgeTotals) => (k === 'luck' ? t.luck : t.parts[k].wins)
    const pairs = seasons.flatMap(s => {
      const next = by.get(`${s.owner}:${s.season + 1}`)
      return next ? [[get(s.totals), get(next)] as const] : []
    })
    return [k, { r: pearson(pairs.map(p => p[0]), pairs.map(p => p[1])), pairs: pairs.length }]
  })) as Record<BridgePart | 'luck', { r: number; pairs: number }>
}

function pearson(xs: number[], ys: number[]): number {
  const n = xs.length
  if (n < 3) return 0
  const mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n
  let cov = 0, vx = 0, vy = 0
  for (let i = 0; i < n; i++) { cov += (xs[i] - mx) * (ys[i] - my); vx += (xs[i] - mx) ** 2; vy += (ys[i] - my) ** 2 }
  return vx && vy ? cov / Math.sqrt(vx * vy) : 0
}

// ── The published file (public/data/bridges.json) ─────────────────────────────

/** A player in an owner-season's projected lineups. */
export interface BridgePlayerRow {
  name: string
  position: string
  channel: Channel
  /** Weeks the projected lineup started him. */
  starts: number
  /** His points above replacement in those weeks. */
  par: number
}

/** A week where the owner's lineup wasn't the projected one. */
export interface BridgeLineupWeek {
  week: number
  points: number
  /** What the projected lineup scored. */
  planned: number
  /** Started by the owner, not by the projections. */
  started: string[]
  /** Started by the projections, not by the owner. */
  benched: string[]
}

export interface OwnerSeasonBridge extends BridgeTotals {
  season: number
  owner: string
  players: BridgePlayerRow[]
  /** The league's average team, same measure: points above replacement by channel, and lineup calls. */
  leagueAverage: Record<BridgePart, number>
  /** Points above replacement by channel, and lineup calls, before the league average comes off. */
  raw: Record<BridgePart, number>
  lineupWeeks: BridgeLineupWeek[]
  /** Each week's head-to-head result against its all-play expected wins. */
  luckWeeks: { week: number; result: 'W' | 'L' | 'T' | ''; expected: number }[]
}

export interface BridgeFile {
  /** Replacement level by season and slot, points per game. */
  replacement: Record<string, Record<string, number>>
  repeatability: Record<BridgePart | 'luck', { r: number; pairs: number }>
  bridges: OwnerSeasonBridge[]
}

