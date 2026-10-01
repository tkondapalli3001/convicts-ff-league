import { describe, it, expect } from 'vitest'
import { computePowerRankings } from '../power-rankings'
import type { Matchup } from '@/types'

function game(week: number, t1: string, p1: number, t2: string, p2: number, type: 'R' | 'P' = 'R'): Matchup {
  return {
    year: 2026, week, team1: t1, pts1: p1, roster1: 1, team2: t2, pts2: p2, roster2: 2,
    type,
    winner: p1 >= p2 ? t1 : t2,
    loser: p1 >= p2 ? t2 : t1,
    margin: Math.abs(p1 - p2),
  }
}

// Four teams, two weeks. Week 1: A beats B, C beats D. Week 2: A beats C, D beats B.
//   through week 1 → C 170, A 146.7, B 113.3, D 90
//   through week 2 → C 144.2, A 141.7, D 135, B 96.7
const GAMES: Matchup[] = [
  game(1, 'A', 120, 'B', 100),
  game(1, 'C', 130, 'D', 90),
  game(2, 'A', 110, 'C', 105),
  game(2, 'D', 140, 'B', 80),
]

describe('computePowerRankings', () => {
  it('applies the Oberon Mt. weights to all-play win%', () => {
    const a = computePowerRankings(GAMES, 2).find(r => r.name === 'A')!
    // avg 115, high 120, low 110, 2–0 but 4–2 all-play → 0.6×115 + 0.2×(120+110) + 0.2×(4/6 × 200)
    expect(a.allPlayPct).toBeCloseTo(4 / 6)
    expect(a.score).toBeCloseTo(69 + 46 + 80 / 3)
    expect(a).toMatchObject({ wins: 2, losses: 0, avg: 115, high: 120, low: 110 })
  })

  it('orders by rating and numbers the ranks', () => {
    const rows = computePowerRankings(GAMES, 2)
    expect(rows.map(r => r.name)).toEqual(['C', 'A', 'D', 'B'])
    expect(rows.map(r => r.rank)).toEqual([1, 2, 3, 4])
  })

  it('ignores schedule luck: same scores, same rating, whatever the record', () => {
    // A and C both score 120 — A drew the week's top scorer and lost, C won
    const rows = computePowerRankings([
      game(1, 'A', 120, 'B', 130),
      game(1, 'C', 120, 'D', 100),
    ], 1)
    const by = Object.fromEntries(rows.map(r => [r.name, r]))
    expect([by.A.wins, by.C.wins]).toEqual([0, 1])
    expect(by.A.score).toBe(by.C.score)
    // Exact rating ties go to the better head-to-head record
    expect(rows.map(r => r.name)).toEqual(['B', 'C', 'A', 'D'])
  })

  it('can rank a big scorer above a better record', () => {
    const rows = computePowerRankings([
      game(1, 'P', 150, 'Q', 60),
      game(1, 'R', 101, 'S', 100),
      game(2, 'R', 149, 'P', 148),
      game(2, 'Q', 70, 'S', 69),
    ], 2)
    // P is 1–1 averaging 149; R is 2–0 averaging 125
    expect(rows[0].name).toBe('P')
    expect(rows[1].name).toBe('R')
  })

  it('reports movement since the previous week, none in week 1', () => {
    expect(computePowerRankings(GAMES, 1).every(r => r.movement === null)).toBe(true)
    const move = Object.fromEntries(computePowerRankings(GAMES, 2).map(r => [r.name, r.movement]))
    expect(move).toEqual({ C: 0, A: 0, D: 1, B: -1 })
  })

  it('counts the all-play record against every team each week', () => {
    const d = computePowerRankings(GAMES, 2).find(r => r.name === 'D')!
    // Week 1: 90 is the low score (0–3). Week 2: 140 is the high score (3–0).
    expect([d.allPlayWins, d.allPlayLosses]).toEqual([3, 3])
  })

  it('scores a tie as half a win', () => {
    const rows = computePowerRankings([game(1, 'A', 100, 'B', 100)], 1)
    expect(rows[0]).toMatchObject({ wins: 0, losses: 0, ties: 1, winPct: 0.5, allPlayTies: 1, allPlayPct: 0.5 })
  })

  it('ignores playoff games, unplayed games, and weeks past throughWeek', () => {
    const rows = computePowerRankings([
      ...GAMES,
      game(3, 'B', 200, 'A', 50),
      game(15, 'B', 200, 'A', 50, 'P'),
      game(2, 'X', 0, 'Y', 0),
    ], 2)
    expect(rows.map(r => r.name)).toEqual(['C', 'A', 'D', 'B'])
  })

  it('tracks each team’s current streak (2+ games)', () => {
    const streak = Object.fromEntries(computePowerRankings(GAMES, 2).map(r => [r.name, r.streak]))
    expect(streak).toEqual({ A: { type: 'W', len: 2 }, B: { type: 'L', len: 2 }, C: null, D: null })
  })

  it('reports the official standing: wins, then points for', () => {
    const standing = Object.fromEntries(computePowerRankings(GAMES, 2).map(r => [r.name, r.standing]))
    // A 2–0; C and D 1–1 (C 235 PF vs D 230); B 0–2
    expect(standing).toEqual({ A: 1, C: 2, D: 3, B: 4 })
  })
})
