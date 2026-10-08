// Template-driven smack talk for matchup previews — every line is a true
// stat, phrased for the group chat. No LLM, no API: candidates come from real
// H2H, season, live-score, projection, injury, power-ranking, and waiver data.
//
// Each fact has a stable id. The pool is ordered — and each fact's phrasing
// picked — by a hash of the matchup plus a seed key (the date), so the ammo
// changes day to day but holds still while live numbers tick inside a line.
// The page shows a few at a time and a reroll steps through the rest.

import { gameKey, type H2HRecord } from '@/lib/stats'
import type { TeamPreview } from './build-preview'
import type { WeekStatus } from './live'
import { ordinal } from './stakes'
import {
  seriesStreak,
  type DaddyStatus, type InjuryReport, type LineupRegret, type PowerRankPoint, type ScoreMark,
  type SeasonHonors, type WeekMoves,
} from './facts'

export interface SmackContext {
  year: number
  week: number
  teamA: TeamPreview
  teamB: TeamPreview
  h2h: H2HRecord
  /** Season luck index per owner (actual wins − expected wins), if available. */
  luck?: Record<string, number>
  // Everything below is optional — facts with missing inputs are skipped.
  status?: WeekStatus
  ptsA?: number
  ptsB?: number
  projA?: number | null
  projB?: number | null
  daddy?: DaddyStatus | null
  /** Power ranks entering the week. */
  ranks?: Record<string, PowerRankPoint>
  honors?: SeasonHonors
  /** Career regular-season wins entering the week. */
  careerWins?: Record<string, number>
  seasonHigh?: ScoreMark | null
  seasonLow?: ScoreMark | null
  /** Each team's costliest lineup call last week. */
  regrets?: Record<string, LineupRegret>
  injuries?: Record<string, InjuryReport>
  moves?: Record<string, WeekMoves>
  /** Championship-path playoff games (buildChampPathGameKeys) — consolation games aren't eliminations. */
  champPath?: Set<string>
}

// ── Hashing ───────────────────────────────────────────────────────────────────

function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

const fmt1 = (n: number) => n.toFixed(1)

function sub100Run(team: TeamPreview): number {
  let n = 0
  for (const s of team.lastScores) {
    if (s < 100) n++
    else break
  }
  return n
}

// ── Fact pool ─────────────────────────────────────────────────────────────────

interface Fact {
  id: string
  text: string
}

function buildFacts(ctx: SmackContext, seed: string): Fact[] {
  const { teamA: A, teamB: B, h2h } = ctx
  const facts: Fact[] = []
  /** One fact, phrased with a seeded pick among the variants. */
  const say = (id: string, ...variants: string[]) => {
    facts.push({ id, text: variants[hashString(`${seed}|${id}|phrase`) % variants.length] })
  }
  const other = (name: string) => (name === A.name ? B.name : A.name)
  const teams = [A, B]
  const meetings = h2h.winsA + h2h.winsB

  // ── Series history ──────────────────────────────────────────────────────────
  const streak = seriesStreak(h2h, A.name)
  if (streak) {
    const loser = other(streak.owner)
    say('h2h-streak',
      `${loser} has dropped ${streak.len} straight to ${streak.owner}. Make it ${streak.len + 1}?`,
      `${streak.owner} has won ${streak.len} straight in this series. ${loser}, blink twice if you need help.`,
      `${streak.len} straight for ${streak.owner} over ${loser}. At some point it's a landlord situation.`)
    if (streak.len >= 4) {
      const lastLoss = h2h.games[streak.len] // games are newest first
      if (lastLoss) {
        say('rent-free',
          `${streak.owner} hasn't lost to ${loser} since ${lastLoss.year}. Rent: still free.`,
          `${loser} last beat ${streak.owner} in ${lastLoss.year}. Somebody frame that one.`)
      } else {
        say('rent-free', `${streak.owner} has never lost to ${loser}. Not once. Rent: free.`)
      }
    }
  }

  if (ctx.daddy) {
    const d = ctx.daddy
    say('daddy',
      `${d.daddy} is ${d.wins}–${d.losses} all-time against ${d.son}. 💦`,
      `${d.son} has won ${d.losses} of ${d.wins + d.losses} meetings with ${d.daddy}. That's not a rivalry, that's a custody arrangement.`,
      `${Math.round(d.rate * 100)}% career win rate vs ${d.son}. ${d.daddy} doesn't scout this one — just shows up.`)
  } else if (meetings >= 4) {
    if (h2h.winsA >= h2h.winsB * 2) say('owns', `${A.name} owns this rivalry: ${h2h.winsA}–${h2h.winsB} lifetime.`)
    else if (h2h.winsB >= h2h.winsA * 2) say('owns', `${B.name} owns this rivalry: ${h2h.winsB}–${h2h.winsA} lifetime.`)
  }

  if (meetings === 0) {
    say('first-meeting',
      'First career meeting. No history, no excuses.',
      'These two have never met. Whoever loses gets the first entry in the record book.')
  } else if (h2h.winsA === h2h.winsB) {
    say('series-lead',
      `Series tied ${h2h.winsA}–${h2h.winsB}. Winner takes the all-time lead; loser takes the group-chat heat.`,
      `${meetings} meetings, dead even. This one breaks the tie.`)
  } else if (Math.abs(h2h.winsA - h2h.winsB) === 1) {
    const [lead, trail] = h2h.winsA > h2h.winsB ? [A.name, B.name] : [B.name, A.name]
    const hi = Math.max(h2h.winsA, h2h.winsB)
    say('series-tie',
      `${lead} leads the all-time series by one. A ${trail} win makes it ${hi}–${hi}.`,
      `${hi}–${hi - 1} ${lead} all-time. ${trail} can square it this week.`)
  }

  const last = h2h.lastGame
  if (last && last.margin > 30) {
    say('last-blowout',
      `Last meeting: ${last.winner} by ${fmt1(last.margin)}. ${last.loser} may still be in concussion protocol.`,
      `${last.loser} lost the last one by ${fmt1(last.margin)}. That film is still being studied.`)
  } else if (last && last.margin < 5) {
    say('last-nailbiter',
      `The last meeting came down to ${last.margin.toFixed(2)} points. ${last.loser} remembers.`,
      `${last.winner} won the last one by ${last.margin.toFixed(2)}. ${last.loser} has been waiting for this.`)
  }
  if (last && ctx.champPath?.has(gameKey(last.year, last.week, last.team1, last.team2))) {
    say('playoff-rematch',
      `${last.winner} ended ${last.loser}'s title run in ${last.year}. The revenge tour starts here.`,
      `Playoff rematch: ${last.winner} knocked ${last.loser} out of the ${last.year} playoffs. ${last.loser} hasn't forgotten.`)
  }

  // ── This season ─────────────────────────────────────────────────────────────
  for (const t of teams) {
    if (t.streak && t.streak.len >= 3) {
      if (t.streak.type === 'W') {
        say(`heater-${t.name}`,
          `${t.name} rides in on a ${t.streak.len}-game heater. 🔥`,
          `${t.streak.len} straight wins for ${t.name}. Somebody pull the fire alarm.`)
      } else {
        say(`skid-${t.name}`,
          `${t.name} has lost ${t.streak.len} straight. Thoughts and prayers.`,
          `${t.streak.len}-game skid for ${t.name}. The waiver wire is right there.`)
      }
    }
    if (t.wins >= 2 && t.losses === 0) {
      say(`unbeaten-${t.name}`,
        `${t.name} is still unbeaten at ${t.wins}–0. Enjoy it while it lasts.`,
        `${t.wins}–0 and smelling themselves. ${t.name}, humility is coming.`)
    }
    if (t.losses >= 2 && t.wins === 0) {
      say(`winless-${t.name}`,
        `${t.name} is still hunting win No. 1.`,
        `0–${t.losses}. ${t.name}'s season is a cry for help.`)
    }
    const drought = sub100Run(t)
    if (drought >= 2) {
      say(`drought-${t.name}`,
        `${t.name} hasn't cracked 100 in ${drought} straight. The bar is literally three digits.`,
        `${drought} straight weeks under 100 for ${t.name}. That's a pattern, not a slump.`)
    }
  }

  if (A.wins + A.losses >= 2 && B.wins + B.losses >= 2) {
    const gap = Math.abs(A.avgPts - B.avgPts)
    if (gap >= 15) {
      const [hi, lo] = A.avgPts > B.avgPts ? [A, B] : [B, A]
      say('scoring-gap',
        `${hi.name} is outscoring ${lo.name} by ${fmt1(gap)} a week this season. Just saying.`,
        `${fmt1(hi.avgPts)} a week for ${hi.name}, ${fmt1(lo.avgPts)} for ${lo.name}. Do the math.`)
    }
  }

  const high = ctx.seasonHigh
  if (high && teams.some(t => t.name === high.owner)) {
    say('season-high',
      `${high.owner} owns the season-high ${fmt1(high.pts)} (Week ${high.week}). Everyone else is playing for second.`,
      `Nobody has topped ${high.owner}'s ${fmt1(high.pts)} from Week ${high.week}. Yet.`)
  }
  const low = ctx.seasonLow
  if (low && teams.some(t => t.name === low.owner)) {
    say('season-low',
      `${low.owner} posted the season's lowest score: ${fmt1(low.pts)} in Week ${low.week}. Nobody's forgotten.`,
      `Week ${low.week}: ${low.owner} put up ${fmt1(low.pts)}. Still the low-water mark of the season.`)
  }

  if (ctx.luck && A.wins + A.losses >= 3) {
    for (const t of teams) {
      const luck = ctx.luck[t.name]
      if (luck == null) continue
      if (luck >= 1.5) {
        say(`luck-${t.name}`,
          `${t.name} has ${fmt1(luck)} more wins than their points deserve — the schedule fairy delivers.`,
          `${t.name}'s record is ${fmt1(luck)} wins better than their scoring. Must be nice.`)
      } else if (luck <= -1.5) {
        say(`luck-${t.name}`,
          `${t.name} is ${fmt1(Math.abs(luck))} wins short of what their points earned. Luck owes them one.`,
          `On points, ${t.name} should have ${fmt1(Math.abs(luck))} more wins. The schedule has been a crime scene.`)
      }
    }
  }

  // ── Power rankings ──────────────────────────────────────────────────────────
  const rA = ctx.ranks?.[A.name]
  const rB = ctx.ranks?.[B.name]
  if (rA && rB) {
    const [hi, lo] = rA.rank < rB.rank ? [A.name, B.name] : [B.name, A.name]
    const [hiRank, loRank] = rA.rank < rB.rank ? [rA.rank, rB.rank] : [rB.rank, rA.rank]
    if (loRank - hiRank >= 5) {
      say('pr-gap',
        `No. ${hiRank} vs No. ${loRank} in the power rankings. On paper this is a mismatch.`,
        `The power rankings have ${hi} ${loRank - hiRank} spots ahead of ${lo}. Paper doesn't play, though.`)
    }
    if (hiRank <= 3 && loRank <= 3) say('pr-top', 'Two top-three power-ranked teams. Clear your Sunday.')
    for (const [t, r] of [[A.name, rA], [B.name, rB]] as const) {
      if (r.movement != null && r.movement >= 3) {
        say(`pr-up-${t}`,
          `${t} jumped ${r.movement} spots in the power rankings. Bandwagon's filling up.`,
          `Up ${r.movement} in the power rankings — ${t} is a stock to buy.`)
      } else if (r.movement != null && r.movement <= -3) {
        say(`pr-down-${t}`,
          `${t} slid ${-r.movement} spots in the power rankings. Free fall.`,
          `Down ${-r.movement} in the power rankings. ${t} is a stock to sell.`)
      }
    }
  }

  // ── This week: projections and live score ──────────────────────────────────
  const { projA, projB } = ctx
  if (projA != null && projB != null && ctx.status !== 'final') {
    const diff = Math.abs(projA - projB)
    const [fav, dog] = projA >= projB ? [A.name, B.name] : [B.name, A.name]
    if (diff < 3) {
      say('proj-close',
        `Sleeper has this within ${fmt1(diff)} points. Coin-flip week.`,
        `Projected ${fmt1(projA)}–${fmt1(projB)}. Bring snacks.`)
    } else if (diff >= 15) {
      say('proj-blowout',
        `Sleeper projects ${fav} by ${fmt1(diff)}. ${dog} needs a miracle or a typo.`,
        `A ${diff.toFixed(0)}-point projected spread. ${dog}, the trade block is open.`)
    }
    if (rA && rB && diff >= 3) {
      const ranked = rA.rank < rB.rank ? A.name : B.name
      if (ranked !== fav) say('proj-vs-pr', `Sleeper likes ${fav}; the power rankings like ${ranked}. Somebody's wrong.`)
    }
  }
  const ptsA = ctx.ptsA ?? 0
  const ptsB = ctx.ptsB ?? 0
  if (ctx.status === 'live' && (ptsA > 0 || ptsB > 0)) {
    const [lead, trail, lp, tp] = ptsA >= ptsB ? [A.name, B.name, ptsA, ptsB] : [B.name, A.name, ptsB, ptsA]
    if (lp - tp >= 20) {
      say('live-score',
        `${lead} is up ${fmt1(lp)}–${fmt1(tp)}. ${trail} needs a heater.`,
        `${fmt1(lp)}–${fmt1(tp)} ${lead}. ${trail}, it's not over until the Monday-night kicker says so.`)
    } else {
      say('live-score', `${fmt1(ptsA)}–${fmt1(ptsB)} with games left. Nobody's safe.`)
    }
  }

  // ── This week: lineups and the waiver wire ─────────────────────────────────
  if (ctx.status !== 'final') {
    for (const t of teams) {
      const inj = ctx.injuries?.[t.name]
      if (inj?.sidelined.length) {
        const s = inj.sidelined[0]
        say(`injured-${t.name}`,
          `${t.name} is starting ${s.name} (${s.status}). Bold strategy.`,
          `${s.name} is listed ${s.status} and still in ${t.name}'s lineup. Set it and forget it.`)
      } else if (inj && inj.questionable >= 2) {
        say(`questionable-${t.name}`,
          `${t.name} has ${inj.questionable} starters listed Questionable. Sunday-morning sweats incoming.`)
      }
      const m = ctx.moves?.[t.name]
      if (m?.topBid && m.topBid.bid >= 10) {
        say(`faab-${t.name}`,
          `${t.name} dropped $${m.topBid.bid} of FAAB on ${m.topBid.player} this week. Desperation or genius?`,
          `$${m.topBid.bid} on ${m.topBid.player}. ${t.name} is either a genius or a cautionary tale.`)
      } else if (m && m.count >= 3) {
        say(`moves-${t.name}`, `${t.name} made ${m.count} roster moves this week. The waiver wire's favorite customer.`)
      }
    }
  }
  for (const t of teams) {
    const r = ctx.regrets?.[t.name]
    if (r && r.cost >= 10 && !r.benched.name.startsWith('#') && !r.started.name.startsWith('#')) {
      say(`regret-${t.name}`,
        `${t.name} benched ${r.benched.name} (${fmt1(r.benched.pts)}) to start ${r.started.name} (${fmt1(r.started.pts)}) last week. Explain yourself.`,
        `${r.benched.name} dropped ${fmt1(r.benched.pts)} on ${t.name}'s bench last week while ${r.started.name} put up ${fmt1(r.started.pts)}. Brutal.`)
    }
  }

  // ── Milestones and honors ───────────────────────────────────────────────────
  for (const t of teams) {
    const wins = ctx.careerWins?.[t.name]
    if (wins != null && (wins + 1) % 25 === 0) {
      say(`milestone-${t.name}`, `A win is ${t.name}'s ${ordinal(wins + 1)} career win. Somebody order a cake.`)
    }
    if (ctx.honors?.champs.includes(t.name)) {
      say(`champ-${t.name}`,
        `${t.name} is the defending champ. Kiss the ring or take the L.`,
        `The ${ctx.honors.year} champ is in the building. ${other(t.name)}, act accordingly.`)
    }
    if (ctx.honors?.toilet === t.name) {
      say(`toilet-${t.name}`,
        `${t.name} — last year's toilet-bowl loser — is still on the redemption tour.`,
        `Reminder: ${t.name} lost the ${ctx.honors.year} toilet bowl. Never forget.`)
    }
  }

  return facts
}

export interface SmackFact {
  /** What the line is about — 'daddy', 'proj', 'pr', 'h2h'… (the fact id's prefix). */
  topic: string
  text: string
}

/**
 * Every ammo fact for the matchup, in today's order. The order and phrasing
 * come from a hash of year|week|pairing|seedKey (pass the date to rotate
 * daily), and a fact keeps its place even as the live numbers inside it move.
 */
export function smackFacts(ctx: SmackContext, seedKey = ''): SmackFact[] {
  const seed = `${ctx.year}|${ctx.week}|${ctx.teamA.name}|${ctx.teamB.name}|${seedKey}`
  return buildFacts(ctx, seed)
    .map(f => ({ topic: f.id.split('-')[0], text: f.text, order: hashString(`${seed}|${f.id}`) }))
    .sort((a, b) => a.order - b.order)
    .map(({ topic, text }) => ({ topic, text }))
}

/** Just the lines of smackFacts, in order. */
export function smackPool(ctx: SmackContext, seedKey = ''): string[] {
  return smackFacts(ctx, seedKey).map(f => f.text)
}

/** The first `max` lines of the pool — deterministic for year|week|pairing|seedKey. */
export function smackLines(ctx: SmackContext, max = 2, seedKey = ''): string[] {
  return smackPool(ctx, seedKey).slice(0, max)
}
