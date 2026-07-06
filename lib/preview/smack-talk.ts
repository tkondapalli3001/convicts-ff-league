// Template-driven smack talk for matchup previews — every line is a true
// stat, phrased for the group chat. No LLM, no API: candidates are derived
// from real H2H/season data and picked with a seeded RNG so a given
// year+week+matchup always shows the same lines (no reroll on refresh).

import type { H2HRecord } from '@/lib/stats'
import type { TeamPreview } from './build-preview'

export interface SmackContext {
  year: number
  week: number
  teamA: TeamPreview
  teamB: TeamPreview
  h2h: H2HRecord
  /** Season luck index per owner (actual wins − expected wins), if available. */
  luck?: Record<string, number>
}

// ── Seeded RNG (mulberry32 over a string hash) ────────────────────────────────

function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ── Fact extraction ───────────────────────────────────────────────────────────

/** Current H2H streak: who owns it and how long (games are most recent first). */
function h2hStreak(h2h: H2HRecord, a: string): { owner: string; len: number } | null {
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

function sub100Run(team: TeamPreview): number {
  let n = 0
  for (const s of team.lastScores) {
    if (s < 100) n++
    else break
  }
  return n
}

// ── Line candidates ───────────────────────────────────────────────────────────

function buildCandidates(ctx: SmackContext): string[] {
  const { teamA: A, teamB: B, h2h } = ctx
  const lines: string[] = []
  const other = (name: string) => (name === A.name ? B.name : A.name)

  // H2H streak
  const streak = h2hStreak(h2h, A.name)
  if (streak && streak.len >= 2) {
    lines.push(`${other(streak.owner)} has dropped ${streak.len} straight to ${streak.owner} — make it ${streak.len + 1}?`)
    if (streak.len >= 4) {
      lines.push(`${streak.owner} hasn't lost to ${other(streak.owner)} since ${h2h.games[streak.len - 1]?.year ?? 'forever'}. Rent free.`)
    }
  }

  // Lifetime dominance / dead heat
  const total = h2h.winsA + h2h.winsB
  if (total >= 4) {
    if (h2h.winsA >= h2h.winsB * 2) lines.push(`${A.name} owns this rivalry: ${h2h.winsA}–${h2h.winsB} lifetime.`)
    else if (h2h.winsB >= h2h.winsA * 2) lines.push(`${B.name} owns this rivalry: ${h2h.winsB}–${h2h.winsA} lifetime.`)
    else if (Math.abs(h2h.winsA - h2h.winsB) <= 1 && total >= 6) {
      lines.push(`Dead even at ${h2h.winsA}–${h2h.winsB} all-time — somebody has to blink.`)
    }
  }

  // Last-meeting blowout
  if (h2h.lastGame && h2h.lastGame.margin > 30) {
    const g = h2h.lastGame
    lines.push(`Last meeting: ${g.winner} won by ${g.margin.toFixed(1)}. ${g.loser} may still be in protocol.`)
  }

  // Season heaters and skids
  for (const t of [A, B]) {
    if (t.streak && t.streak.len >= 3) {
      if (t.streak.type === 'W') lines.push(`${t.name} rides in on a ${t.streak.len}-game heater.`)
      else lines.push(`${t.name} has lost ${t.streak.len} straight — someone check on them.`)
    }
    const drought = sub100Run(t)
    if (drought >= 2) lines.push(`${t.name} hasn't cracked 100 in ${drought} straight games.`)
  }

  // Scoring gap
  if (A.wins + A.losses >= 3 && B.wins + B.losses >= 3) {
    const gap = Math.abs(A.avgPts - B.avgPts)
    if (gap >= 15) {
      const [hi, lo] = A.avgPts > B.avgPts ? [A, B] : [B, A]
      lines.push(`${hi.name} is outscoring ${lo.name} by ${gap.toFixed(1)} a week this season. Just saying.`)
    }
  }

  // Luck
  if (ctx.luck) {
    for (const t of [A, B]) {
      const luck = ctx.luck[t.name]
      if (luck == null) continue
      if (luck >= 1.5) lines.push(`${t.name} has ${luck.toFixed(1)} more wins than their points deserve — the schedule fairy delivers.`)
      else if (luck <= -1.5) lines.push(`${t.name} is ${Math.abs(luck).toFixed(1)} wins short of what their points earned. Luck owes them one.`)
    }
  }

  return lines
}

/** Up to `max` smack lines, deterministic for a given year|week|pairing. */
export function smackLines(ctx: SmackContext, max = 2): string[] {
  const candidates = buildCandidates(ctx)
  if (candidates.length <= max) return candidates

  const rng = mulberry32(hashString(`${ctx.year}|${ctx.week}|${ctx.teamA.name}|${ctx.teamB.name}`))
  const pool = [...candidates]
  const picked: string[] = []
  while (picked.length < max && pool.length) {
    picked.push(pool.splice(Math.floor(rng() * pool.length), 1)[0])
  }
  return picked
}
