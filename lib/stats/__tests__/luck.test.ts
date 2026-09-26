import { describe, it, expect } from 'vitest'
import { allPlayRecords, computeLuckIndex } from '../luck'
import { computePowerRankings } from '../power-rankings'
import type { LeagueState, Matchup, SleeperMatchup } from '@/types'

function row(roster_id: number, matchup_id: number, points: number): SleeperMatchup {
  return { roster_id, matchup_id, points }
}

const NAMES = { 2025: { 1: 'A', 2: 'B', 3: 'C', 4: 'D' } }

// Week 1: A 120 beats B 100; C 100 beats D 90 — B and C tie at 100 in all-play.
// Week 2: A 80 loses to C 130; D 110 beats B 70.
// Week 15 (playoffs): must be ignored.
const MATCHUPS: LeagueState['matchups'] = {
  2025: {
    1: { isPlayoff: false, matchups: [row(1, 1, 120), row(2, 1, 100), row(3, 2, 100), row(4, 2, 90)] },
    2: { isPlayoff: false, matchups: [row(1, 1, 80), row(3, 1, 130), row(4, 2, 110), row(2, 2, 70)] },
    15: { isPlayoff: true, matchups: [row(1, 1, 200), row(2, 1, 10), row(3, 2, 10), row(4, 2, 5)] },
  },
}

describe('allPlayRecords', () => {
  it('counts every other team that played, ties as half an expected win', () => {
    const r = allPlayRecords([
      [{ name: 'A', pts: 120 }, { name: 'B', pts: 100 }, { name: 'C', pts: 100 }, { name: 'D', pts: 90 }],
    ])
    expect(r.A).toEqual({ wins: 3, losses: 0, ties: 0, expectedWins: 1 })
    expect(r.B).toMatchObject({ wins: 1, losses: 1, ties: 1 })
    expect(r.B.expectedWins).toBeCloseTo(1.5 / 3)
  })

  it('leaves out teams that did not score', () => {
    const r = allPlayRecords([[{ name: 'A', pts: 100 }, { name: 'B', pts: 90 }, { name: 'C', pts: 0 }]])
    expect(r.C).toBeUndefined()
    expect(r.A).toEqual({ wins: 1, losses: 0, ties: 0, expectedWins: 1 })
  })
})

describe('computeLuckIndex', () => {
  const byOwner = Object.fromEntries(computeLuckIndex(MATCHUPS, NAMES).map(e => [e.owner, e]))

  it('is actual wins minus all-play expected wins, regular season only', () => {
    // A: wk1 outscores all 3, wk2 only B's 70 → 1 + 1/3 expected; 1 actual win
    expect(byOwner.A.expectedWins).toBeCloseTo(1.33, 2)
    expect(byOwner.A.actualWins).toBe(1)
    expect(byOwner.A.luckIndex).toBeCloseTo(-0.33, 2)
  })

  it('credits an all-play tie as half a win', () => {
    // C: wk1 beats D, ties B → 1.5/3; wk2 beats everyone → 3/3 → 1.5 expected; 2 actual
    expect(byOwner.C.expectedWins).toBe(1.5)
    expect(byOwner.C.luckIndex).toBe(0.5)
  })

  it('sorts luckiest first and scopes to one season with filterYear', () => {
    const entries = computeLuckIndex({ ...MATCHUPS, 2024: MATCHUPS[2025] }, { ...NAMES, 2024: NAMES[2025] }, 2025)
    expect(entries.map(e => e.owner)).toEqual(Object.values(byOwner).sort((a, b) => b.luckIndex - a.luckIndex).map(e => e.owner))
    expect(entries.find(e => e.owner === 'C')!.actualWins).toBe(2)
  })

  it('agrees with the all-play record in Power Rankings', () => {
    const games: Matchup[] = [
      [1, 'A', 120, 'B', 100], [1, 'C', 100, 'D', 90], [2, 'A', 80, 'C', 130], [2, 'D', 110, 'B', 70],
    ].map(([week, team1, pts1, team2, pts2]) => ({
      year: 2025, week: week as number, team1: team1 as string, pts1: pts1 as number, roster1: 0,
      team2: team2 as string, pts2: pts2 as number, roster2: 0, type: 'R' as const,
      winner: '', loser: '', margin: 0,
    }))
    const pr = Object.fromEntries(computePowerRankings(games, 2).map(r => [r.name, r]))
    const ap = allPlayRecords([
      [{ name: 'A', pts: 120 }, { name: 'B', pts: 100 }, { name: 'C', pts: 100 }, { name: 'D', pts: 90 }],
      [{ name: 'A', pts: 80 }, { name: 'C', pts: 130 }, { name: 'D', pts: 110 }, { name: 'B', pts: 70 }],
    ])
    for (const name of ['A', 'B', 'C', 'D']) {
      expect([pr[name].allPlayWins, pr[name].allPlayLosses, pr[name].allPlayTies])
        .toEqual([ap[name].wins, ap[name].losses, ap[name].ties])
    }
  })
})
