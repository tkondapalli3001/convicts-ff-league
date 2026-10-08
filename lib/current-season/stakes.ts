// What a matchup means for each team's playoff hopes. Early in the season
// that's simulated playoff odds (with a win vs a loss); once the math allows,
// the exact clinch / elimination conditions too — always accounting for every
// other game of the week, never just this one.

import { simulatePlayoffOdds, hashSeed, type ScheduleGame, type ScoringModel, type TeamResults } from './playoff-odds'
import { playoffScenarios, type NeededResult, type PlayoffStatus, type WeekScenario } from './playoff-scenarios'

export interface TeamStakes {
  status: PlayoffStatus
  /** Simulated playoff odds entering the week, 0–1. */
  odds: number
  ifWin: number
  ifLoss: number
  /** 'clinched' when a win alone guarantees a spot, 'eliminated' when a loss alone ends it. */
  ifWinStatus: PlayoffStatus
  ifLossStatus: PlayoffStatus
  /** Exact conditions, verb first — "clinches a playoff spot with a win and a Nathan loss". */
  scenarios: string[]
}

export function ordinal(n: number): string {
  const rem100 = n % 100
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`
  switch (n % 10) {
    case 1: return `${n}st`
    case 2: return `${n}nd`
    case 3: return `${n}rd`
    default: return `${n}th`
  }
}

/** Odds as a percentage; simulations never say "certain" unless the math does. */
export function formatOdds(p: number, status: PlayoffStatus = 'alive'): string {
  if (status === 'clinched') return '100%'
  if (status === 'eliminated') return '0%'
  if (p >= 0.995) return '>99%'
  if (p <= 0.005) return '<1%'
  return `${Math.round(p * 100)}%`
}

// ── Phrasing ─────────────────────────────────────────────────────────────────

function article(name: string): string {
  return /^[aeiou]/i.test(name) ? 'an' : 'a'
}

function list(items: string[]): string {
  return items.length <= 1 ? items[0] ?? '' : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

/** "a Nathan loss" */
function noun(n: NeededResult): string {
  return `${article(n.team)} ${n.team} ${n.result}`
}

/** "Raghav and Sonu both win" / "Raghav wins and Nathan loses" */
function clause(needs: NeededResult[]): string {
  if (needs.length === 2 && needs[0].result === needs[1].result) {
    return `${needs[0].team} and ${needs[1].team} both ${needs[0].result === 'win' ? 'win' : 'lose'}`
  }
  return list(needs.map(n => `${n.team} ${n.result === 'win' ? 'wins' : 'loses'}`))
}

/** "a win", "a win and a Nathan loss", "a win and either a Nathan loss or an Eric loss" */
function condition(s: WeekScenario): string {
  const own = s.result === 'win' ? 'a win' : 'a loss'
  if (s.needs.some(set => set.length === 0)) return own
  if (s.needs.length > 1 && s.needs.every(set => set.length === 1)) {
    return `${own} and either ${s.needs.map(set => noun(set[0])).join(' or ')}`
  }
  // Several ways, some needing more than one result: the simplest is a true, sufficient condition
  return list([own, ...s.needs[0].map(noun)])
}

export function clinchPhrase(clinch: WeekScenario[]): string | null {
  if (!clinch.length) return null
  // playoffScenarios lists the win first
  return `clinches a playoff spot with ${clinch.map(condition).join(', or with ')}`
}

export function eliminationPhrase(eliminate: WeekScenario[]): string | null {
  const loss = eliminate.find(s => s.result === 'loss')
  const win = eliminate.find(s => s.result === 'win')
  if (!loss && !win) return null
  const parts: string[] = []
  if (loss) parts.push(`with ${condition(loss)}`)
  // A win can only knock a team out if other results go against it
  if (win) parts.push(`${loss ? 'or even with a win' : 'even with a win'}${win.needs[0].length ? `, if ${clause(win.needs[0])}` : ''}`)
  return `is eliminated ${parts.join(' — ')}`
}

// ── The week's stakes ────────────────────────────────────────────────────────

const cache = new Map<string, Record<string, TeamStakes>>()
const CACHE_SIZE = 24

/**
 * Stakes for every team entering `week`. `teams` hold final results before the
 * week; `schedule` must include every regular-season game from `week` on.
 * Cached by input, so the live tab's minute-by-minute polling doesn't re-run
 * the simulation.
 */
export function weekStakes(input: {
  teams: TeamResults[]
  schedule: ScheduleGame[]
  week: number
  playoffSpots: number
  model: ScoringModel
  seedKey: string
}): Record<string, TeamStakes> {
  const { teams, schedule, week, playoffSpots, model, seedKey } = input
  if (!schedule.some(g => g.week === week)) return {}

  const key = [
    seedKey, playoffSpots, model.mean.toFixed(3), model.sigma.toFixed(3), model.priorGames.toFixed(3),
    teams.map(t => `${t.name}:${t.wins}:${t.pf.toFixed(2)}:${t.scores.length}`).join(','),
    schedule.map(g => `${g.week}:${g.a}:${g.b}`).join(','),
  ].join('|')
  const hit = cache.get(key)
  if (hit) return hit

  const odds = simulatePlayoffOdds(teams, schedule, { playoffSpots, model, focusWeek: week, seed: hashSeed(seedKey) })
  const scen = playoffScenarios(Object.fromEntries(teams.map(t => [t.name, t.wins])), schedule, week, playoffSpots)

  const out: Record<string, TeamStakes> = {}
  for (const t of teams) {
    const s = scen[t.name]
    const status = s?.status ?? 'alive'
    const pin = (p: number) => (status === 'clinched' ? 1 : status === 'eliminated' ? 0 : p)
    // A win alone that clinches (or a loss alone that eliminates) is certain, not a simulation
    const ifWinStatus: PlayoffStatus = status !== 'alive' ? status
      : s?.clinch.some(c => c.result === 'win' && c.needs.some(n => !n.length)) ? 'clinched' : 'alive'
    const ifLossStatus: PlayoffStatus = status !== 'alive' ? status
      : s?.eliminate.some(c => c.result === 'loss' && c.needs.some(n => !n.length)) ? 'eliminated' : 'alive'
    out[t.name] = {
      status,
      odds: pin(odds.playoff[t.name] ?? 0),
      ifWin: ifWinStatus === 'clinched' ? 1 : pin(odds.ifWin[t.name] ?? 0),
      ifLoss: ifLossStatus === 'eliminated' ? 0 : pin(odds.ifLoss[t.name] ?? 0),
      ifWinStatus,
      ifLossStatus,
      scenarios: s ? [clinchPhrase(s.clinch), eliminationPhrase(s.eliminate)].filter((x): x is string => x != null) : [],
    }
  }

  cache.set(key, out)
  if (cache.size > CACHE_SIZE) cache.delete(cache.keys().next().value!)
  return out
}
