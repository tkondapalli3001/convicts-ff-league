// Playoff odds for the 2026 tab: simulate the rest of the regular season many
// times and count how often each team finishes in the playoff spots. Pure and
// seeded, so the same inputs always give the same odds (no flicker between
// renders or devices).

export interface ScheduleGame {
  week: number
  a: string
  b: string
}

export interface TeamResults {
  name: string
  /** Wins so far, ties counting ½. */
  wins: number
  pf: number
  /** Final regular-season scores so far. */
  scores: number[]
}

export interface ScoringModel {
  /** League scoring average that team averages regress toward. */
  mean: number
  /** Week-to-week spread of one team's score. */
  sigma: number
  /** Games of league-average scoring blended into each team's average. */
  priorGames: number
}

export interface PlayoffOdds {
  /** Share of simulated seasons finishing in the playoff spots, 0–1. */
  playoff: Record<string, number>
  /** The same, among simulations where the team won / lost its `focusWeek` game. */
  ifWin: Record<string, number>
  ifLoss: Record<string, number>
}

/** Fallbacks when there's no completed season to learn from. */
const DEFAULT_SIGMA = 23
const DEFAULT_PRIOR_GAMES = 9
const DEFAULT_SIMS = 10_000

/**
 * Fit the simulation's scoring model to completed regular seasons: `sigma` is
 * the typical week-to-week swing around a team's own average, and
 * `priorGames` = sigma² / (spread of true team strength)² — how many games it
 * takes before a team's average says more about it than the league's does.
 * (Convicts history: a ±23-point weekly swing against only ±7 of real
 * difference between teams, so about 9 games.)
 */
export function fitScoringModel(
  history: { season: number; team: string; pts: number }[],
  seasonScores: number[],
): ScoringModel {
  const byTeamSeason: Record<string, number[]> = {}
  for (const g of history) (byTeamSeason[`${g.season}|${g.team}`] ??= []).push(g.pts)

  const within: number[] = []
  const means: { season: number; mean: number; n: number }[] = []
  for (const [key, pts] of Object.entries(byTeamSeason)) {
    if (pts.length < 4) continue
    const mean = pts.reduce((a, b) => a + b, 0) / pts.length
    within.push(pts.reduce((a, b) => a + (b - mean) ** 2, 0) / (pts.length - 1))
    means.push({ season: Number(key.split('|')[0]), mean, n: pts.length })
  }

  let sigma = DEFAULT_SIGMA
  let priorGames = DEFAULT_PRIOR_GAMES
  if (within.length >= 8) {
    const sigma2 = within.reduce((a, b) => a + b, 0) / within.length
    // Spread of team averages around their own season's average
    const seasonMean: Record<number, number[]> = {}
    for (const m of means) (seasonMean[m.season] ??= []).push(m.mean)
    const devs = means.map(m => {
      const all = seasonMean[m.season]
      return m.mean - all.reduce((a, b) => a + b, 0) / all.length
    })
    const nBar = means.reduce((a, m) => a + m.n, 0) / means.length
    const tau2 = devs.reduce((a, d) => a + d * d, 0) / Math.max(1, devs.length - 1) - sigma2 / nBar
    sigma = Math.sqrt(sigma2)
    if (tau2 > 0) priorGames = Math.min(20, Math.max(3, sigma2 / tau2))
  }

  // Regress toward this season's scoring level, else the latest season's
  const latest = Math.max(0, ...history.map(g => g.season))
  const latestPts = history.filter(g => g.season === latest).map(g => g.pts)
  const pool = seasonScores.length ? seasonScores : latestPts
  const mean = pool.length ? pool.reduce((a, b) => a + b, 0) / pool.length : 115
  return { mean, sigma, priorGames }
}

/** mulberry32 — small, fast, seedable. */
function rng(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6D2B79F5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function hashSeed(key: string): number {
  let h = 2166136261
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619)
  return h >>> 0
}

/**
 * Simulate the remaining `schedule` `sims` times. Each team's weekly score is
 * drawn around its average so far, pulled toward the league average by the
 * model's prior (early-season averages are mostly noise). Seeds go by wins,
 * then points for — Sleeper's order — using the simulated points.
 */
export function simulatePlayoffOdds(
  teams: TeamResults[],
  schedule: ScheduleGame[],
  opts: { playoffSpots: number; model: ScoringModel; focusWeek: number; seed: number; sims?: number },
): PlayoffOdds {
  const { playoffSpots, model, focusWeek, seed } = opts
  const sims = opts.sims ?? DEFAULT_SIMS
  const n = teams.length
  const idx = new Map(teams.map((t, i) => [t.name, i]))
  const games = schedule
    .map(g => ({ week: g.week, a: idx.get(g.a), b: idx.get(g.b) }))
    .filter((g): g is { week: number; a: number; b: number } => g.a != null && g.b != null)

  const mu = teams.map(t => {
    const sum = t.scores.reduce((a, b) => a + b, 0)
    return (sum + model.priorGames * model.mean) / (t.scores.length + model.priorGames)
  })

  const made = new Float64Array(n)
  const winMade = new Float64Array(n)
  const winCount = new Float64Array(n)
  const lossMade = new Float64Array(n)
  const lossCount = new Float64Array(n)
  const wins = new Float64Array(n)
  const pf = new Float64Array(n)
  const focus = new Int8Array(n) // 1 won the focus game, -1 lost, 0 didn't play
  const order = Array.from({ length: n }, (_, i) => i)
  const rand = rng(seed)
  let spare: number | null = null
  const gauss = () => {
    if (spare != null) { const s = spare; spare = null; return s }
    let u = 0
    while (u === 0) u = rand()
    const r = Math.sqrt(-2 * Math.log(u))
    const th = 2 * Math.PI * rand()
    spare = r * Math.sin(th)
    return r * Math.cos(th)
  }

  for (let s = 0; s < sims; s++) {
    for (let i = 0; i < n; i++) {
      wins[i] = teams[i].wins
      pf[i] = teams[i].pf
      focus[i] = 0
    }
    for (const g of games) {
      const sa = mu[g.a] + model.sigma * gauss()
      const sb = mu[g.b] + model.sigma * gauss()
      const aWon = sa > sb
      wins[aWon ? g.a : g.b] += 1
      pf[g.a] += sa
      pf[g.b] += sb
      if (g.week === focusWeek) {
        focus[g.a] = aWon ? 1 : -1
        focus[g.b] = aWon ? -1 : 1
      }
    }
    order.sort((x, y) => wins[y] - wins[x] || pf[y] - pf[x])
    for (let k = 0; k < n; k++) {
      const i = order[k]
      const inField = k < playoffSpots ? 1 : 0
      made[i] += inField
      if (focus[i] === 1) { winCount[i]++; winMade[i] += inField }
      else if (focus[i] === -1) { lossCount[i]++; lossMade[i] += inField }
    }
  }

  const out: PlayoffOdds = { playoff: {}, ifWin: {}, ifLoss: {} }
  teams.forEach((t, i) => {
    out.playoff[t.name] = made[i] / sims
    // A side that (almost) never happens in the simulations: fall back to the overall odds
    out.ifWin[t.name] = winCount[i] ? winMade[i] / winCount[i] : made[i] / sims
    out.ifLoss[t.name] = lossCount[i] ? lossMade[i] / lossCount[i] : made[i] / sims
  })
  return out
}
