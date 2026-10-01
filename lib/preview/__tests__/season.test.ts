import { describe, it, expect } from 'vitest'
import { rankSeasonStats } from '../season-stats'
import { ownerSchedule } from '../schedule'
import type { ScheduleGame } from '../playoff-odds'
import type { WeekStatus } from '../live'
import type { Matchup } from '@/types'

describe('rankSeasonStats', () => {
  it('ranks each position by fantasy points, sharing ties and skipping players who have not played', () => {
    const ranked = rankSeasonStats([
      { id: 'a', position: 'QB', fpts: 100, gp: 3 },
      { id: 'b', position: 'QB', fpts: 120, gp: 3 },
      { id: 'c', position: 'QB', fpts: 100, gp: 3 },
      { id: 'd', position: 'QB', fpts: 0, gp: 0 },
      { id: 'e', position: 'WR', fpts: 50, gp: 2 },
    ])
    expect(Object.fromEntries(Object.entries(ranked).map(([id, p]) => [id, p.rank]))).toEqual({ a: 2, b: 1, c: 2, d: null, e: 1 })
    expect(ranked.e).toEqual({ fpts: 50, gp: 2, position: 'WR', rank: 1 })
  })
})

describe('ownerSchedule', () => {
  const g = (week: number, team1: string, pts1: number, team2: string, pts2: number): Matchup => ({
    year: 2026, week, team1, pts1, roster1: 0, team2, pts2, roster2: 0, type: 'R',
    winner: pts1 >= pts2 ? team1 : team2, loser: pts1 >= pts2 ? team2 : team1, margin: Math.abs(pts1 - pts2),
  })
  const schedule: Record<number, ScheduleGame[]> = {
    1: [{ week: 1, a: 'A', b: 'B' }],
    2: [{ week: 2, a: 'C', b: 'A' }],
    3: [{ week: 3, a: 'A', b: 'D' }],
    4: [{ week: 4, a: 'B', b: 'A' }],
    5: [{ week: 5, a: 'A', b: 'C' }],
  }
  const games = [g(1, 'A', 120, 'B', 100), g(2, 'C', 110, 'A', 90), g(3, 'A', 140, 'D', 100), g(4, 'B', 30, 'A', 50)]
  const statusOf = (w: number): WeekStatus => (w <= 3 ? 'final' : w === 4 ? 'live' : 'upcoming')

  it('gives results, the running record, and the season high and low for final weeks', () => {
    const rows = ownerSchedule('A', schedule, games, statusOf)
    expect(rows.slice(0, 3).map(r => [r.week, r.opponent, r.result, r.pts, r.oppPts, r.record, r.mark])).toEqual([
      [1, 'B', 'W', 120, 100, '1–0', null],
      [2, 'C', 'L', 90, 110, '1–1', 'low'],
      [3, 'D', 'W', 140, 100, '2–1', 'high'],
    ])
  })

  it('shows the score so far for a live week and only the opponent after that', () => {
    const [, , , live, next] = ownerSchedule('A', schedule, games, statusOf)
    expect(live).toMatchObject({ week: 4, opponent: 'B', status: 'live', result: null, pts: 50, oppPts: 30, record: null })
    expect(next).toMatchObject({ week: 5, opponent: 'C', status: 'upcoming', result: null, pts: null, oppPts: null })
  })
})
