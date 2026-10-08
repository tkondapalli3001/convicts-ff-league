import { describe, it, expect } from 'vitest'
import { fitScoringModel, simulatePlayoffOdds } from '../playoff-odds'
import type { ScheduleGame, ScoringModel, TeamResults } from '../playoff-odds'
import { playoffScenarios } from '../playoff-scenarios'
import { clinchPhrase, eliminationPhrase, formatOdds, weekStakes } from '../stakes'
import { scheduleGaps, seasonSchedule } from '../schedule'
import type { LeagueState, SleeperMatchup } from '@/types'

const MODEL: ScoringModel = { mean: 115, sigma: 23, priorGames: 9 }

function teamsOf(wins: Record<string, number>, avg = 115, played = 3): TeamResults[] {
  return Object.entries(wins).map(([name, w]) => ({ name, wins: w, pf: avg * played, scores: Array(played).fill(avg) }))
}

/** Round robin of `names`, one round per week from `startWeek` (needs an even count). */
function roundRobin(names: string[], startWeek: number, weeks: number): ScheduleGame[] {
  const out: ScheduleGame[] = []
  const rot = [...names]
  for (let w = 0; w < weeks; w++) {
    for (let i = 0; i < rot.length / 2; i++) out.push({ week: startWeek + w, a: rot[i], b: rot[rot.length - 1 - i] })
    rot.splice(1, 0, rot.pop()!)
  }
  return out
}

// ── The scoring model ────────────────────────────────────────────────────────

describe('fitScoringModel', () => {
  it('learns the weekly swing and how far to trust a team average', () => {
    // Two seasons, four teams, real spread in team strength plus weekly noise
    const history = [2024, 2025].flatMap(season => ['A', 'B', 'C', 'D'].flatMap((team, i) =>
      Array.from({ length: 14 }, (_, w) => ({ season, team, pts: 100 + i * 12 + (w % 2 ? 20 : -20) }))))
    const m = fitScoringModel(history, [120, 130])
    expect(m.sigma).toBeCloseTo(Math.sqrt(400 * 14 / 13), 5)
    expect(m.priorGames).toBeGreaterThanOrEqual(3)
    expect(m.priorGames).toBeLessThanOrEqual(20)
    expect(m.mean).toBe(125)
  })

  it('falls back to sensible defaults without history', () => {
    expect(fitScoringModel([], [])).toEqual({ mean: 115, sigma: 23, priorGames: 9 })
  })
})

// ── Simulated odds ───────────────────────────────────────────────────────────

describe('simulatePlayoffOdds', () => {
  const names = ['A', 'B', 'C', 'D', 'E', 'F']
  const schedule = roundRobin(names, 4, 4)

  it('hands out exactly the playoff spots in every simulated season', () => {
    const odds = simulatePlayoffOdds(teamsOf({ A: 3, B: 2, C: 2, D: 1, E: 1, F: 0 }), schedule, { playoffSpots: 4, model: MODEL, focusWeek: 4, seed: 7, sims: 2000 })
    const total = Object.values(odds.playoff).reduce((a, b) => a + b, 0)
    expect(total).toBeCloseTo(4, 6)
  })

  it('is deterministic for a seed', () => {
    const run = () => simulatePlayoffOdds(teamsOf({ A: 3, B: 2, C: 2, D: 1, E: 1, F: 0 }), schedule, { playoffSpots: 4, model: MODEL, focusWeek: 4, seed: 42, sims: 500 })
    expect(run()).toEqual(run())
  })

  it('a win helps and a loss hurts', () => {
    const odds = simulatePlayoffOdds(teamsOf({ A: 2, B: 2, C: 2, D: 1, E: 1, F: 1 }), schedule, { playoffSpots: 3, model: MODEL, focusWeek: 4, seed: 3, sims: 4000 })
    for (const n of names) expect(odds.ifWin[n]).toBeGreaterThan(odds.ifLoss[n])
  })

  it('a team that can no longer catch the field never makes it', () => {
    // F can reach 4 wins at most; A–D already have 9
    const odds = simulatePlayoffOdds(teamsOf({ A: 9, B: 9, C: 9, D: 9, E: 0, F: 0 }), schedule, { playoffSpots: 4, model: MODEL, focusWeek: 4, seed: 1, sims: 500 })
    expect(odds.playoff.F).toBe(0)
    expect(odds.playoff.A).toBe(1)
  })
})

// ── Exact scenarios ──────────────────────────────────────────────────────────

describe('playoffScenarios', () => {
  it('finds clinch-with-help and elimination conditions in the final week', () => {
    // Two spots. A, B, C sit on 3 wins; D, E, F on 0. Final week: A–D, B–E, C–F.
    const sched: ScheduleGame[] = [{ week: 14, a: 'A', b: 'D' }, { week: 14, a: 'B', b: 'E' }, { week: 14, a: 'C', b: 'F' }]
    const s = playoffScenarios({ A: 3, B: 3, C: 3, D: 0, E: 0, F: 0 }, sched, 14, 2)
    expect(s.A.status).toBe('alive')
    expect(s.A.clinch).toEqual([{ result: 'win', needs: [[{ team: 'B', result: 'loss' }], [{ team: 'C', result: 'loss' }]] }])
    expect(s.A.eliminate).toEqual([{ result: 'loss', needs: [[{ team: 'B', result: 'win' }, { team: 'C', result: 'win' }]] }])
    expect(s.D.status).toBe('eliminated')
  })

  it('never lets a tie in wins decide anything (points for is unknown)', () => {
    // A win puts A level with whoever wins B–C, so A can't clinch outright
    const sched: ScheduleGame[] = [{ week: 14, a: 'A', b: 'D' }, { week: 14, a: 'B', b: 'C' }]
    const s = playoffScenarios({ A: 3, B: 4, C: 4, D: 0 }, sched, 14, 2)
    expect(s.A.clinch).toEqual([])
    expect(s.A.eliminate).toEqual([{ result: 'loss', needs: [[]] }])
  })

  it('says win-or-lose elimination conditions plainly', () => {
    // Two spots. C trails A and B by one; if both win, C is out even with a win.
    const sched: ScheduleGame[] = [{ week: 14, a: 'A', b: 'E' }, { week: 14, a: 'B', b: 'F' }, { week: 14, a: 'C', b: 'D' }]
    const s = playoffScenarios({ A: 4, B: 4, C: 3, D: 3, E: 1, F: 1 }, sched, 14, 2)
    expect(eliminationPhrase(s.C.eliminate)).toBe('is eliminated with a loss — or even with a win, if A and B both win')
  })

  it('names the rival still in the race, and treats a clinching win as certain', () => {
    // Week 13 of 14, six spots
    const wins = { Armaan: 9, Teja: 8, Kerry: 8, Manu: 7, Raghav: 6, Sonu: 6, Eric: 5, Nathan: 5, Daniyaal: 4, Dustin: 3 }
    const sched: ScheduleGame[] = [
      { week: 13, a: 'Armaan', b: 'Dustin' }, { week: 13, a: 'Teja', b: 'Daniyaal' }, { week: 13, a: 'Kerry', b: 'Nathan' },
      { week: 13, a: 'Manu', b: 'Eric' }, { week: 13, a: 'Raghav', b: 'Sonu' },
      { week: 14, a: 'Armaan', b: 'Kerry' }, { week: 14, a: 'Teja', b: 'Manu' }, { week: 14, a: 'Raghav', b: 'Nathan' },
      { week: 14, a: 'Sonu', b: 'Eric' }, { week: 14, a: 'Daniyaal', b: 'Dustin' },
    ]
    const s = playoffScenarios(wins, sched, 13, 6)
    expect(s.Kerry.status).toBe('clinched')
    // Kerry beating Nathan is the help Manu needs — but it's Nathan who's still chasing
    expect(clinchPhrase(s.Manu.clinch)).toBe('clinches a playoff spot with a win, or with a loss, a Nathan loss and a Sonu loss')

    const stakes = weekStakes({ teams: teamsOf(wins, 115, 12), schedule: sched, week: 13, playoffSpots: 6, model: MODEL, seedKey: 'w13' })
    expect(stakes.Manu).toMatchObject({ ifWin: 1, ifWinStatus: 'clinched', ifLossStatus: 'alive' })
    expect(stakes.Daniyaal).toMatchObject({ ifLoss: 0, ifLossStatus: 'eliminated' })
    expect(stakes.Dustin.status).toBe('eliminated')
  })

  it('stays silent early in the season', () => {
    const names = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']
    const s = playoffScenarios(Object.fromEntries(names.map((n, i) => [n, i % 4])), roundRobin(names, 4, 11), 4, 6)
    for (const n of names) expect(s[n]).toEqual({ status: 'alive', clinch: [], eliminate: [] })
  })
})

// ── Phrasing and the combined stakes ─────────────────────────────────────────

describe('stakes phrasing', () => {
  it('writes clinch conditions the way the group chat says them', () => {
    expect(clinchPhrase([{ result: 'win', needs: [[]] }])).toBe('clinches a playoff spot with a win')
    expect(clinchPhrase([
      { result: 'win', needs: [[]] },
      { result: 'loss', needs: [[{ team: 'Nathan', result: 'loss' }]] },
    ])).toBe('clinches a playoff spot with a win, or with a loss and a Nathan loss')
    expect(clinchPhrase([{ result: 'win', needs: [[{ team: 'Eric', result: 'loss' }], [{ team: 'Armaan', result: 'loss' }]] }]))
      .toBe('clinches a playoff spot with a win and either an Eric loss or an Armaan loss')
    expect(clinchPhrase([])).toBeNull()
  })

  it('never shows certainty the math has not earned', () => {
    expect(formatOdds(0.999)).toBe('>99%')
    expect(formatOdds(0.001)).toBe('<1%')
    expect(formatOdds(1, 'clinched')).toBe('100%')
    expect(formatOdds(0.736)).toBe('74%')
  })

  it('pins odds to the exact status', () => {
    const sched: ScheduleGame[] = [{ week: 14, a: 'A', b: 'B' }, { week: 14, a: 'C', b: 'D' }]
    const stakes = weekStakes({ teams: teamsOf({ A: 9, B: 8, C: 2, D: 1 }), schedule: sched, week: 14, playoffSpots: 2, model: MODEL, seedKey: 't' })
    expect(stakes.A).toMatchObject({ status: 'clinched', odds: 1, ifWin: 1, ifLoss: 1 })
    expect(stakes.D).toMatchObject({ status: 'eliminated', odds: 0 })
  })
})

describe('seasonSchedule', () => {
  const row = (roster_id: number, matchup_id: number): SleeperMatchup =>
    ({ roster_id, matchup_id, points: 0, starters: [], players: [] }) as unknown as SleeperMatchup
  const state = {
    leagues: { 2026: { settings: { playoff_week_start: 4 } } },
    rosterUserMaps: { 2026: { 1: 'A', 2: 'B', 3: 'C', 4: 'D' } },
    matchups: { 2026: { 1: { matchups: [row(1, 1), row(2, 1), row(3, 2), row(4, 2)], isPlayoff: false } } },
  } as unknown as LeagueState

  it('pairs owners by matchup, filling unloaded weeks from fetched pairings', () => {
    expect(scheduleGaps(state, 2026)).toEqual([2, 3])
    const sched = seasonSchedule(state, 2026, { 2: [row(1, 1), row(3, 1), row(2, 2), row(4, 2)] })
    expect(sched[1]).toEqual([{ week: 1, a: 'A', b: 'B' }, { week: 1, a: 'C', b: 'D' }])
    expect(sched[2]).toEqual([{ week: 2, a: 'A', b: 'C' }, { week: 2, a: 'B', b: 'D' }])
    expect(sched[3]).toBeUndefined()
  })
})
