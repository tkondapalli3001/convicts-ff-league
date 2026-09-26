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
//   through week 1 → C 170, A 160, B 100, D 90
//   through week 2 → A 155, C 137.5, D 135, B 90
const GAMES: Matchup[] = [
  game(1, 'A', 120, 'B', 100),
  game(1, 'C', 130, 'D', 90),
  game(2, 'A', 110, 'C', 105),
  game(2, 'D', 140, 'B', 80),
]

describe('computePowerRankings', () => {
  it('applies the Oberon Mt. formula', () => {
    const a = computePowerRankings(GAMES, 2).find(r => r.name === 'A')!
    // avg 115, high 120, low 110, 2–0 → (115×6 + (120+110)×2 + (1×200)×2) / 10
    expect(a.score).toBeCloseTo(155)
    expect(a).toMatchObject({ wins: 2, losses: 0, avg: 115, high: 120, low: 110 })
  })

  it('orders by rating and numbers the ranks', () => {
    const rows = computePowerRankings(GAMES, 2)
    expect(rows.map(r => r.name)).toEqual(['A', 'C', 'D', 'B'])
    expect(rows.map(r => r.rank)).toEqual([1, 2, 3, 4])
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
    expect(move).toEqual({ A: 1, C: -1, D: 1, B: -1 })
  })

  it('counts the all-play record against every team each week', () => {
    const d = computePowerRankings(GAMES, 2).find(r => r.name === 'D')!
    // Week 1: 90 is the low score (0–3). Week 2: 140 is the high score (3–0).
    expect([d.allPlayWins, d.allPlayLosses]).toEqual([3, 3])
  })

  it('scores a tie as half a win', () => {
    const rows = computePowerRankings([game(1, 'A', 100, 'B', 100)], 1)
    expect(rows[0]).toMatchObject({ wins: 0, losses: 0, ties: 1, winPct: 0.5, allPlayTies: 1 })
  })

  it('ignores playoff games, unplayed games, and weeks past throughWeek', () => {
    const rows = computePowerRankings([
      ...GAMES,
      game(3, 'B', 200, 'A', 50),
      game(15, 'B', 200, 'A', 50, 'P'),
      game(2, 'X', 0, 'Y', 0),
    ], 2)
    expect(rows.map(r => r.name)).toEqual(['A', 'C', 'D', 'B'])
  })

  it('reports the official standing: wins, then points for', () => {
    const standing = Object.fromEntries(computePowerRankings(GAMES, 2).map(r => [r.name, r.standing]))
    // A 2–0; C and D 1–1 (C 235 PF vs D 230); B 0–2
    expect(standing).toEqual({ A: 1, C: 2, D: 3, B: 4 })
  })
})
