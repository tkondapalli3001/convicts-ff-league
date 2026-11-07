// How sure each number can be. Ranges for a record, Bayesian shrinkage for
// small samples (head-to-head, player win rates), schedule-permutation
// percentiles for luck, and the repeatability test for anything that might be
// called skill. Pure and seeded; scripts/uncertainty-report.ts runs it over
// league history. Random functions take the generator as an argument.

type Random = () => number

// ── Ranges ────────────────────────────────────────────────────────────────────

/** Wilson 95% range for a win rate: stays sensible at small samples and near 0 or 1. */
export function wilsonRange(wins: number, n: number, z = 1.96): [number, number] {
  if (n === 0) return [0, 1]
  const p = wins / n, z2 = z * z, d = 1 + z2 / n
  const mid = p + z2 / (2 * n)
  const half = z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))
  return [Math.max(0, (mid - half) / d), Math.min(1, (mid + half) / d)]
}

// ── Beta distribution ─────────────────────────────────────────────────────────

/** Lanczos log-gamma. */
function logGamma(x: number): number {
  const c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5]
  let y = x
  const tmp = x + 5.5 - (x + 0.5) * Math.log(x + 5.5)
  let ser = 1.000000000190015
  for (const v of c) ser += v / ++y
  return -tmp + Math.log((2.5066282746310005 * ser) / x)
}
const logBeta = (a: number, b: number) => logGamma(a) + logGamma(b) - logGamma(a + b)

/** Regularized incomplete beta: P(X ≤ x) for X ~ Beta(a, b), by continued fraction. */
export function betaCdf(x: number, a: number, b: number): number {
  if (x <= 0) return 0
  if (x >= 1) return 1
  const front = Math.exp(a * Math.log(x) + b * Math.log(1 - x) - logBeta(a, b))
  const fraction = (x2: number, a2: number, b2: number) => {
    const tiny = 1e-300
    let c = 1, d = 1 - ((a2 + b2) * x2) / (a2 + 1)
    if (Math.abs(d) < tiny) d = tiny
    d = 1 / d
    let h = d
    for (let m = 1; m <= 500; m++) {
      const m2 = 2 * m
      let aa = (m * (b2 - m) * x2) / ((a2 + m2 - 1) * (a2 + m2))
      d = 1 + aa * d; if (Math.abs(d) < tiny) d = tiny
      c = 1 + aa / c; if (Math.abs(c) < tiny) c = tiny
      d = 1 / d
      h *= d * c
      aa = (-(a2 + m) * (a2 + b2 + m) * x2) / ((a2 + m2) * (a2 + m2 + 1))
      d = 1 + aa * d; if (Math.abs(d) < tiny) d = tiny
      c = 1 + aa / c; if (Math.abs(c) < tiny) c = tiny
      d = 1 / d
      const del = d * c
      h *= del
      if (Math.abs(del - 1) < 1e-12) break
    }
    return h
  }
  return x < (a + 1) / (a + b + 2) ? (front * fraction(x, a, b)) / a : 1 - (front * fraction(1 - x, b, a)) / b
}

function betaQuantile(q: number, a: number, b: number): number {
  let lo = 0, hi = 1
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2
    if (betaCdf(mid, a, b) < q) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

/**
 * Chance a coin-flip series of n games shows one side winning at least `rate`
 * of them, with at least `minGames` played: how often a fair matchup still
 * earns a badge like Daddy.
 */
export function chanceOfLopsidedSeries(n: number, rate: number, minGames: number): number {
  if (n < minGames) return 0
  let choose = 1, total = 0
  for (let w = 0; w <= n; w++) {
    if (Math.max(w, n - w) / n >= rate) total += choose
    choose = (choose * (n - w)) / (w + 1)
  }
  return total / 2 ** n
}

// ── Shrinkage ─────────────────────────────────────────────────────────────────

/** Priors weaker than this aren't tried; stronger ones mean the records show no real differences. */
const STRENGTHS = Array.from({ length: 81 }, (_, i) => 2 * 10 ** (i / 20)) // 2 … 20,000

/** The largest strength tried: "the records are what pure chance would give". */
export const NO_SIGNAL_STRENGTH = STRENGTHS[STRENGTHS.length - 1]

/**
 * Empirical Bayes: how strongly the league's records say to pull each one
 * toward `mean`. The prior Beta(mean·k, (1−mean)·k) acts like k extra games at
 * the mean, and k is the value that makes the records most likely (beta-binomial
 * maximum likelihood). Small k: real differences. Huge k: indistinguishable
 * from chance.
 */
export function fitShrinkage(records: { wins: number; n: number }[], mean = 0.5): number {
  let best = STRENGTHS[0], bestLl = -Infinity
  for (const k of STRENGTHS) {
    const a = mean * k, b = (1 - mean) * k
    let ll = 0
    for (const r of records) ll += logBeta(r.wins + a, r.n - r.wins + b) - logBeta(a, b)
    if (ll > bestLl) { bestLl = ll; best = k }
  }
  return best
}

export interface ShrunkRate {
  /** Best estimate of the true rate. */
  rate: number
  low: number
  high: number
  /** Chance the true rate is above ½. */
  pAboveHalf: number
}

/** A record pulled toward `mean` by k games' worth of prior, with its 95% range. */
export function shrinkRate(wins: number, n: number, k: number, mean = 0.5): ShrunkRate {
  const a = mean * k + wins, b = (1 - mean) * k + n - wins
  return { rate: a / (a + b), low: betaQuantile(0.025, a, b), high: betaQuantile(0.975, a, b), pAboveHalf: 1 - betaCdf(0.5, a, b) }
}

// ── Luck against every schedule ───────────────────────────────────────────────

export interface ScheduleGame {
  a: string
  b: string
  ptsA: number
  ptsB: number
}

/**
 * Wins each team would have had under `sims` other schedules: the league's
 * real weekly pairings and real scores, with teams randomly reassigned to the
 * schedule's slots. Under every assignment, a team's chance of facing any
 * opponent in a week is equal, so the average matches its all-play expected wins.
 */
export function scheduleSamples(weeks: ScheduleGame[][], sims: number, rand: Random): Record<string, Float64Array> {
  const teams = [...new Set(weeks.flat().flatMap(g => [g.a, g.b]))].sort()
  const slot = new Map(teams.map((t, i) => [t, i]))
  const n = teams.length
  const pairings = weeks.map(games => games.map(g => [slot.get(g.a)!, slot.get(g.b)!] as const))
  const scores = weeks.map(games => {
    const pts = new Float64Array(n)
    for (const g of games) { pts[slot.get(g.a)!] = g.ptsA; pts[slot.get(g.b)!] = g.ptsB }
    return pts
  })
  const out = teams.map(() => new Float64Array(sims))
  const assign = teams.map((_, i) => i)
  for (let s = 0; s < sims; s++) {
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1))
      ;[assign[i], assign[j]] = [assign[j], assign[i]]
    }
    pairings.forEach((pairs, w) => {
      const pts = scores[w]
      for (const [sa, sb] of pairs) {
        const ta = assign[sa], tb = assign[sb]
        if (pts[ta] > pts[tb]) out[ta][s] += 1
        else if (pts[tb] > pts[ta]) out[tb][s] += 1
        else { out[ta][s] += 0.5; out[tb][s] += 0.5 }
      }
    })
  }
  return Object.fromEntries(teams.map((t, i) => [t, out[i]]))
}

/** Share of samples below `value`, equal ones counting half: 4 means worse in only 4% of schedules. */
export function percentileOf(samples: Float64Array, value: number): number {
  let below = 0
  for (const s of samples) below += s < value ? 1 : s === value ? 0.5 : 0
  return (below / samples.length) * 100
}

// ── Repeatability ─────────────────────────────────────────────────────────────

export function pearson(xs: number[], ys: number[]): number {
  const n = xs.length
  if (n < 3) return 0
  const mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n
  let cov = 0, vx = 0, vy = 0
  for (let i = 0; i < n; i++) { cov += (xs[i] - mx) * (ys[i] - my); vx += (xs[i] - mx) ** 2; vy += (ys[i] - my) ** 2 }
  return vx && vy ? cov / Math.sqrt(vx * vy) : 0
}

const centerBySeason = (rows: SeasonValue[]): Map<string, number> => {
  const out = new Map<string, number>()
  for (const season of new Set(rows.map(r => r.season))) {
    const these = rows.filter(r => r.season === season)
    const mean = these.reduce((a, r) => a + r.value, 0) / these.length
    for (const r of these) out.set(`${r.owner}:${season}`, r.value - mean)
  }
  return out
}

/** One owner's value of a stat in one season. */
export interface SeasonValue {
  owner: string
  season: number
  value: number
}

export interface Repeatability {
  /** Correlation with the same owner's next season. */
  r: number
  /** Its 95% range (Fisher z): how big a real effect the sample could be hiding. */
  low: number
  high: number
  pairs: number
  /** Chance of an r this high if owners' seasons were shuffled within each season. */
  p: number
  /** Share of a season's spread that belongs to the owner across every season, 0 if none. */
  ownerShare: number
  ownerP: number
}

export interface WinLink {
  /** Correlation with the same season's win rate. */
  sameSeason: number
  /** Correlation with next season's win rate. */
  nextSeason: number
  nextPairs: number
}

/** Does a stat go with winning: this season, and more tellingly, the next? Season-centered. */
export function linkToWins(stat: SeasonValue[], winRate: SeasonValue[]): WinLink {
  const s = centerBySeason(stat), w = centerBySeason(winRate)
  const same: [number, number][] = [], next: [number, number][] = []
  for (const r of stat) {
    const v = s.get(`${r.owner}:${r.season}`)!
    const now = w.get(`${r.owner}:${r.season}`), later = w.get(`${r.owner}:${r.season + 1}`)
    if (now != null) same.push([v, now])
    if (later != null) next.push([v, later])
  }
  return {
    sameSeason: pearson(same.map(p => p[0]), same.map(p => p[1])),
    nextSeason: pearson(next.map(p => p[0]), next.map(p => p[1])),
    nextPairs: next.length,
  }
}

/**
 * Is a stat real inside a season? The correlation between an owner's odd and
 * even weeks, season-centered, with significance from shuffling owners within
 * seasons. Same opponents' luck, same roster: if this is near zero, a season's
 * total is mostly noise even before next year's draft.
 */
export function splitHalf(rows: { owner: string; season: number; odd: number; even: number }[], rand: Random, shuffles = 2000): { r: number; p: number; n: number } {
  const odd = centerBySeason(rows.map(r => ({ owner: r.owner, season: r.season, value: r.odd })))
  const even = centerBySeason(rows.map(r => ({ owner: r.owner, season: r.season, value: r.even })))
  const seasons = [...new Set(rows.map(r => r.season))]
  const pairsFor = (season: number) => rows.filter(r => r.season === season).map(r => [odd.get(`${r.owner}:${season}`)!, even.get(`${r.owner}:${season}`)!] as const)
  const data = seasons.map(pairsFor)
  const corr = (d: (readonly [number, number])[][]) => pearson(d.flat().map(p => p[0]), d.flat().map(p => p[1]))
  const r = corr(data)
  let hits = 0
  for (let i = 0; i < shuffles; i++) {
    const shuffled = data.map(pairs => {
      const evens = pairs.map(p => p[1])
      for (let j = evens.length - 1; j > 0; j--) {
        const k = Math.floor(rand() * (j + 1))
        ;[evens[j], evens[k]] = [evens[k], evens[j]]
      }
      return pairs.map((p, idx) => [p[0], evens[idx]] as const)
    })
    if (corr(shuffled) >= r) hits++
  }
  return { r, p: (hits + 1) / (shuffles + 1), n: rows.length }
}

/**
 * Does a stat stick to the owner? Values are centered within each season, so a
 * high-scoring year can't look like a good owner. Significance comes from
 * shuffling owners within seasons.
 */
export function repeatability(rows: SeasonValue[], rand: Random, shuffles = 2000): Repeatability {
  const seasons = [...new Set(rows.map(r => r.season))].sort((a, b) => a - b)
  const centered = seasons.map(season => {
    const these = rows.filter(r => r.season === season)
    const mean = these.reduce((a, r) => a + r.value, 0) / these.length
    return { season, owners: these.map(r => r.owner), values: these.map(r => r.value - mean) }
  })
  const lagR = (data: typeof centered) => {
    const lookup = new Map(data.flatMap(d => d.owners.map((o, i) => [`${o}:${d.season}`, d.values[i]] as const)))
    const xs: number[] = [], ys: number[] = []
    for (const d of data) {
      d.owners.forEach((o, i) => {
        const next = lookup.get(`${o}:${d.season + 1}`)
        if (next != null) { xs.push(d.values[i]); ys.push(next) }
      })
    }
    return { r: pearson(xs, ys), pairs: xs.length }
  }
  const share = (data: typeof centered) => {
    const byOwner = new Map<string, number[]>()
    for (const d of data) d.owners.forEach((o, i) => { (byOwner.get(o) ?? byOwner.set(o, []).get(o)!).push(d.values[i]) })
    const groups = [...byOwner.values()]
    const N = groups.reduce((a, g) => a + g.length, 0)
    const between = groups.reduce((a, g) => a + g.length * (g.reduce((x, y) => x + y, 0) / g.length) ** 2, 0)
    const within = groups.reduce((a, g) => {
      const m = g.reduce((x, y) => x + y, 0) / g.length
      return a + g.reduce((x, y) => x + (y - m) ** 2, 0)
    }, 0)
    const msb = between / Math.max(1, groups.length - 1), msw = within / Math.max(1, N - groups.length)
    const n0 = (N - groups.reduce((a, g) => a + g.length ** 2, 0) / N) / Math.max(1, groups.length - 1)
    return { f: msw ? msb / msw : 0, icc: Math.max(0, (msb - msw) / (msb + (n0 - 1) * msw || 1)) }
  }
  const observed = lagR(centered), own = share(centered)
  let lagHits = 0, ownHits = 0
  for (let i = 0; i < shuffles; i++) {
    const shuffled = centered.map(d => {
      const owners = [...d.owners]
      for (let j = owners.length - 1; j > 0; j--) {
        const k = Math.floor(rand() * (j + 1))
        ;[owners[j], owners[k]] = [owners[k], owners[j]]
      }
      return { ...d, owners }
    })
    if (lagR(shuffled).r >= observed.r) lagHits++
    if (share(shuffled).f >= own.f) ownHits++
  }
  const z = Math.atanh(Math.max(-0.999, Math.min(0.999, observed.r))), se = 1 / Math.sqrt(Math.max(1, observed.pairs - 3))
  return {
    r: observed.r, low: Math.tanh(z - 1.96 * se), high: Math.tanh(z + 1.96 * se), pairs: observed.pairs,
    p: (lagHits + 1) / (shuffles + 1), ownerShare: own.icc, ownerP: (ownHits + 1) / (shuffles + 1),
  }
}

export type StickVerdict = 'sticks' | 'weak' | 'no evidence'

/**
 * The verdict rule. With this many stats tested, one p under 0.05 proves
 * little: "sticks" needs the owner's share at p < 0.01, "weak" either test
 * under 0.05. "No evidence" isn't proof of nothing: seven seasons can hide a
 * small effect (see the range on r).
 */
export function stickVerdict(rep: Repeatability): StickVerdict {
  return rep.ownerP < 0.01 ? 'sticks' : rep.p < 0.05 || rep.ownerP < 0.05 ? 'weak' : 'no evidence'
}
