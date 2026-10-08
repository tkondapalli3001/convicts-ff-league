// Exact playoff clinch / elimination scenarios for one week. Unlike the odds,
// nothing here is estimated: a team "clinches" only if it makes the field in
// every possible finish, losing every points tiebreaker, and is "eliminated"
// only if it misses in every finish, winning every points tiebreaker. Points
// for can't be known in advance, so a tie in wins never counts for or against
// anyone.

import type { ScheduleGame } from './playoff-odds'

export type PlayoffStatus = 'clinched' | 'eliminated' | 'alive'

/** One other game's result a scenario needs. */
export interface NeededResult {
  team: string
  result: 'win' | 'loss'
}

export interface WeekScenario {
  /** The team's own result this week. */
  result: 'win' | 'loss'
  /** Alternatives (any one will do), each a set of other results that must all happen; [[]] = nothing else needed. */
  needs: NeededResult[][]
}

export interface TeamScenarios {
  /** Entering the week. */
  status: PlayoffStatus
  clinch: WeekScenario[]
  eliminate: WeekScenario[]
}

/** Above this many games left, settle for the (still exact-or-silent) bounds check. */
const EXACT_MAX_GAMES = 10
/** Show at most this many alternative condition sets per result. */
const MAX_ALTERNATIVES = 2

interface Status {
  clinched: boolean[]
  eliminated: boolean[]
}

/**
 * Every possible finish of `games` (2^games of them). Clinched: no finish
 * leaves `spots` or more teams level with or ahead of the team. Eliminated:
 * every finish has `spots` or more teams strictly ahead.
 */
function exactStatus(wins: number[], games: [number, number][], spots: number): Status {
  const n = wins.length
  const canMiss = new Array<boolean>(n).fill(false)
  const canMake = new Array<boolean>(n).fill(false)
  const final = new Array<number>(n)
  for (let mask = 0; mask < 1 << games.length; mask++) {
    for (let i = 0; i < n; i++) final[i] = wins[i]
    games.forEach(([a, b], g) => { final[(mask >> g) & 1 ? a : b] += 1 })
    for (let t = 0; t < n; t++) {
      let levelOrAhead = 0
      let ahead = 0
      for (let x = 0; x < n; x++) {
        if (x === t) continue
        if (final[x] >= final[t]) levelOrAhead++
        if (final[x] > final[t]) ahead++
      }
      if (levelOrAhead >= spots) canMiss[t] = true
      if (ahead < spots) canMake[t] = true
    }
  }
  return { clinched: canMiss.map(m => !m), eliminated: canMake.map(m => !m) }
}

/**
 * Cheap and conservative: treats every remaining game as winnable by anyone,
 * ignoring that two rivals can't both win their meeting. It can miss a clinch
 * the exact check would find, but never claims one that isn't real.
 */
function boundStatus(wins: number[], left: number[], spots: number): Status {
  const n = wins.length
  const clinched: boolean[] = []
  const eliminated: boolean[] = []
  for (let t = 0; t < n; t++) {
    let threats = 0
    let surelyAhead = 0
    for (let x = 0; x < n; x++) {
      if (x === t) continue
      if (wins[x] + left[x] >= wins[t]) threats++
      if (wins[x] > wins[t] + left[t]) surelyAhead++
    }
    clinched.push(threats < spots)
    eliminated.push(surelyAhead >= spots)
  }
  return { clinched, eliminated }
}

function status(wins: number[], games: [number, number][], spots: number): Status {
  if (games.length <= EXACT_MAX_GAMES) return exactStatus(wins, games, spots)
  const left = new Array<number>(wins.length).fill(0)
  for (const [a, b] of games) { left[a]++; left[b]++ }
  return boundStatus(wins, left, spots)
}

/**
 * Minimal sets of other results that make `holds` true whatever else happens.
 * `others` are this week's other games; `holds(mask)` reads bit g as "games[g]'s
 * first team won".
 */
function implicants(others: number, holds: (mask: number) => boolean): Map<number, number>[] {
  // A partial assignment: game → 1 (first team wins) / 0 (second team wins); absent = either
  const found: Map<number, number>[] = []
  const total = 3 ** others
  const candidates: Map<number, number>[] = []
  for (let code = 0; code < total; code++) {
    const fixed = new Map<number, number>()
    let c = code
    for (let g = 0; g < others; g++) {
      const v = c % 3
      c = Math.floor(c / 3)
      if (v > 0) fixed.set(g, v === 1 ? 1 : 0)
    }
    candidates.push(fixed)
  }
  candidates.sort((x, y) => x.size - y.size)
  for (const fixed of candidates) {
    // Already covered by a smaller set?
    if (found.some(f => [...f].every(([g, v]) => fixed.get(g) === v))) continue
    let all = true
    for (let mask = 0; mask < 1 << others && all; mask++) {
      if ([...fixed].some(([g, v]) => ((mask >> g) & 1) !== v)) continue
      if (!holds(mask)) all = false
    }
    if (all) found.push(fixed)
  }
  return found
}

/**
 * Each team's playoff status entering `week`, plus exactly what would clinch
 * or eliminate it this week. `wins` are wins so far (ties ½); `schedule` must
 * hold every remaining regular-season game, this week's included.
 */
export function playoffScenarios(
  wins: Record<string, number>,
  schedule: ScheduleGame[],
  week: number,
  playoffSpots: number,
): Record<string, TeamScenarios> {
  const names = Object.keys(wins)
  const idx = new Map(names.map((n, i) => [n, i]))
  const pair = (g: ScheduleGame): [number, number] | null => {
    const a = idx.get(g.a)
    const b = idx.get(g.b)
    return a != null && b != null ? [a, b] : null
  }
  const thisWeek = schedule.filter(g => g.week === week).map(pair).filter((g): g is [number, number] => g != null)
  const later = schedule.filter(g => g.week > week).map(pair).filter((g): g is [number, number] => g != null)
  const base = names.map(n => wins[n])

  const entering = status(base, [...thisWeek, ...later], playoffSpots)

  // Status after each of this week's 2^games outcomes
  const after: Status[] = []
  for (let mask = 0; mask < 1 << thisWeek.length; mask++) {
    const w = [...base]
    thisWeek.forEach(([a, b], g) => { w[(mask >> g) & 1 ? a : b] += 1 })
    after.push(status(w, later, playoffSpots))
  }

  const out: Record<string, TeamScenarios> = {}
  names.forEach((name, t) => {
    const st: PlayoffStatus = entering.clinched[t] ? 'clinched' : entering.eliminated[t] ? 'eliminated' : 'alive'
    const res: TeamScenarios = { status: st, clinch: [], eliminate: [] }
    out[name] = res
    const own = thisWeek.findIndex(([a, b]) => a === t || b === t)
    if (st !== 'alive' || own < 0) return

    const otherGames = thisWeek.map((g, i) => ({ g, i })).filter(({ i }) => i !== own)
    // Rebuild a full outcome mask from the team's result + the other games' bits
    const full = (won: boolean, otherMask: number) => {
      let mask = 0
      otherGames.forEach(({ i }, k) => { if ((otherMask >> k) & 1) mask |= 1 << i })
      const teamIsFirst = thisWeek[own][0] === t
      if (won === teamIsFirst) mask |= 1 << own
      return mask
    }
    const settled = (i: number) => entering.clinched[i] || entering.eliminated[i]
    // Name the side fans would: a team still in the race over one that's
    // settled, then the closer rival by wins, then — on a tie — the chaser for
    // a clinch ("a Nathan loss") or the pacesetter for an elimination ("a Raghav win")
    const describe = (kind: 'clinch' | 'eliminate') => (fixed: Map<number, number>): NeededResult[] =>
      [...fixed].map(([k, v]) => {
        const [a, b] = otherGames[k].g
        const winner = v === 1 ? a : b
        const loser = v === 1 ? b : a
        const sw = settled(winner) ? 1 : 0
        const sl = settled(loser) ? 1 : 0
        const dw = Math.abs(base[winner] - base[t])
        const dl = Math.abs(base[loser] - base[t])
        const nameLoser = sl !== sw ? sl < sw
          : dl !== dw ? dl < dw
          : kind === 'clinch' ? base[loser] <= base[winner] : base[loser] > base[winner]
        return nameLoser ? { team: names[loser], result: 'loss' as const } : { team: names[winner], result: 'win' as const }
      })

    for (const won of [true, false]) {
      const result = won ? 'win' as const : 'loss' as const
      const clinchSets = implicants(otherGames.length, m => after[full(won, m)].clinched[t])
      if (clinchSets.length) res.clinch.push({ result, needs: clinchSets.slice(0, MAX_ALTERNATIVES).map(describe('clinch')) })
      const elimSets = implicants(otherGames.length, m => after[full(won, m)].eliminated[t])
      if (elimSets.length) res.eliminate.push({ result, needs: elimSets.slice(0, MAX_ALTERNATIVES).map(describe('eliminate')) })
    }
  })
  return out
}
