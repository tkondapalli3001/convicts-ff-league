// Matchup of the Week: the pairing with the most on the line. Each matchup
// earns points for playoff stakes, on-field action, and history at stake; the
// top scorer is featured, and its biggest factors become the "why it matters"
// reasons on the card.

import { gameKey, type H2HRecord } from '@/lib/stats'
import { DADDY_WIN_RATE, seriesStreak, type DaddyStatus, type PowerRankPoint, type SeasonHonors } from './facts'
import { ordinal, type Implication } from './implications'
import type { TeamPreview } from './build-preview'
import type { WeekStatus } from './live'

export interface MotwCandidate {
  teamA: TeamPreview
  teamB: TeamPreview
  h2h: H2HRecord
  status: WeekStatus
  ptsA: number
  ptsB: number
  projA: number | null
  projB: number | null
  implicationA: Implication | null
  implicationB: Implication | null
  daddy: DaddyStatus | null
}

export interface MotwContext {
  week: number
  /** Power ranks entering the week. */
  ranks: Record<string, PowerRankPoint>
  /** Career regular-season wins entering the week. */
  careerWins: Record<string, number>
  honors: SeasonHonors
  /** Championship-path playoff games — a consolation game isn't a rematch worth billing. */
  champPath?: Set<string>
}

export interface MatchupOfTheWeek {
  index: number
  score: number
  /** Why it was picked — the biggest factors first. */
  reasons: string[]
  /** What those reasons cover (same vocabulary as SmackFact.topic), so ammo can avoid repeating them. */
  topics: string[]
}

interface Factor {
  /** Matches SmackFact.topic where the two overlap: 'proj', 'pr', 'series', 'h2h', 'daddy'… */
  topic: string
  weight: number
  text: string
}

function lowerFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1)
}

/** Every factor a matchup earns, unsorted. Exported for tests. */
export function matchupFactors(c: MotwCandidate, ctx: MotwContext, avgProjTotal: number | null): Factor[] {
  const { teamA: A, teamB: B, h2h } = c
  const out: Factor[] = []
  const add = (topic: string, weight: number, text: string) => { if (weight > 0) out.push({ topic, weight, text }) }

  // ── Playoff picture — weighs more as the standings firm up ─────────────────
  const firm = Math.min(1, ctx.week / 8)
  for (const [t, imp] of [[A, c.implicationA], [B, c.implicationB]] as const) {
    if (!imp) continue
    if (imp.playoffNote) add('standings', 1 + 3 * firm, `${t.name}: ${lowerFirst(imp.playoffNote)}`)
    const swing = imp.lossSeed - imp.winSeed
    if (swing >= 3) add('standings', swing * 0.3 * firm, `${t.name} swings ${swing} spots in the standings on the result`)
  }
  if (A.wins + A.losses > 0 && A.wins === B.wins && A.losses === B.losses) {
    add('standings', 0.8, `Both ${A.wins}–${A.losses} — the winner pulls ahead`)
  }

  // ── Action ──────────────────────────────────────────────────────────────────
  if (c.projA != null && c.projB != null && c.status !== 'final') {
    const diff = Math.abs(c.projA - c.projB)
    add('proj', 3 - diff / 3, diff < 1
      ? `Sleeper can't split them: ${c.projA.toFixed(1)}–${c.projB.toFixed(1)}`
      : `Projected within ${diff.toFixed(1)} points`)
    const total = c.projA + c.projB
    if (avgProjTotal != null && total - avgProjTotal >= 8) {
      add('proj', Math.min(2, (total - avgProjTotal) / 10), `Projected shootout: ${total.toFixed(0)} combined points`)
    }
  }
  if (c.status === 'live' && (c.ptsA > 0 || c.ptsB > 0) && Math.abs(c.ptsA - c.ptsB) < 10) {
    add('live', 1.5, `Live and tight: ${c.ptsA.toFixed(1)}–${c.ptsB.toFixed(1)}`)
  }
  const rA = ctx.ranks[A.name]?.rank
  const rB = ctx.ranks[B.name]?.rank
  if (rA != null && rB != null) {
    const n = Object.keys(ctx.ranks).length
    const quality = (n + 1 - (rA + rB) / 2) / n // ~1 when both are elite, ~0 when both are bottom
    add('pr', quality * 2 - 0.6, rA <= 3 && rB <= 3 ? 'Two top-three power-ranked teams' : `Power-ranked No. ${rA} vs No. ${rB}`)
  }
  const hot = [A, B].filter(t => t.streak?.type === 'W' && t.streak.len >= 2)
  if (hot.length === 2) add('heater', 1, `Two hot teams: ${A.name} has won ${A.streak!.len} straight, ${B.name} ${B.streak!.len}`)
  else for (const t of hot) if (t.streak!.len >= 3) add('heater', 0.6, `${t.name} brings a ${t.streak!.len}-game heater`)

  // ── History at stake ───────────────────────────────────────────────────────
  const meetings = h2h.winsA + h2h.winsB
  const gap = h2h.winsA - h2h.winsB
  if (meetings >= 8 && Math.abs(gap) <= 1) {
    add('series', 2, `${meetings} all-time meetings and it's ${Math.max(h2h.winsA, h2h.winsB)}–${Math.min(h2h.winsA, h2h.winsB)}`)
  }
  if (meetings > 0 && gap === 0) add('series', 1, 'Winner takes the all-time series lead')
  else if (Math.abs(gap) === 1) add('series', 0.8, `A ${gap > 0 ? B.name : A.name} win ties the all-time series`)
  if (c.daddy && c.daddy.wins / (c.daddy.wins + c.daddy.losses + 1) < DADDY_WIN_RATE) {
    add('daddy', 1.5, `${c.daddy.daddy}'s 💦 Daddy status is on the line (${c.daddy.wins}–${c.daddy.losses})`)
  }
  const streak = seriesStreak(h2h, A.name)
  if (streak && streak.len >= 3) add('h2h', 0.8, `${streak.owner} has won ${streak.len} straight in this series`)
  const last = h2h.lastGame
  if (last && ctx.champPath?.has(gameKey(last.year, last.week, last.team1, last.team2))) {
    add('playoff', 1, `Playoff rematch: ${last.winner} ended ${last.loser}'s title run in ${last.year}`)
  }
  for (const t of [A, B]) {
    const wins = ctx.careerWins[t.name]
    if (wins != null && (wins + 1) % 25 === 0) add('milestone', 1, `A win is ${t.name}'s ${ordinal(wins + 1)} career win`)
  }
  if (ctx.honors.champs.some(n => n === A.name || n === B.name)) add('champ', 0.4, 'The defending champ is in it')

  return out
}

/** The week's featured matchup, or null when there are no matchups. */
export function pickMatchupOfTheWeek(candidates: MotwCandidate[], ctx: MotwContext): MatchupOfTheWeek | null {
  if (!candidates.length) return null
  const totals = candidates.flatMap(c => (c.projA != null && c.projB != null ? [c.projA + c.projB] : []))
  const avgProjTotal = totals.length ? totals.reduce((a, b) => a + b, 0) / totals.length : null
  const rankSum = (c: MotwCandidate) => (ctx.ranks[c.teamA.name]?.rank ?? 99) + (ctx.ranks[c.teamB.name]?.rank ?? 99)

  const scored = candidates.map((c, index) => {
    const factors = matchupFactors(c, ctx, avgProjTotal)
    return { index, factors, score: factors.reduce((a, f) => a + f.weight, 0), rankSum: rankSum(c) }
  })
  // Ties go to the better-ranked pairing, then the earlier matchup
  scored.sort((x, y) => y.score - x.score || x.rankSum - y.rankSum || x.index - y.index)
  const best = scored[0]
  const top = [...best.factors].sort((a, b) => b.weight - a.weight).slice(0, 3)
  return { index: best.index, score: best.score, reasons: top.map(f => f.text), topics: top.map(f => f.topic) }
}
