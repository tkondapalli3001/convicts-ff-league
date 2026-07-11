import { describe, it, expect } from 'vitest'
import { computeRecords } from '../records'
import { gameKey, buildConsolationGameKeys, excludeManualGames } from '../game-filters'
import type { Matchup, OwnerSeason, SleeperLeague } from '@/types'

// ─── Fixture: 3 owners, 2 seasons, incl. a consolation game and a manually
// excluded game. Locks in the record-book rules: manual exclusions drop out of
// everything, consolation games drop out of low80 only, and streaks span
// season boundaries.

function game(year: number, week: number, t1: string, p1: number, t2: string, p2: number, type: 'R' | 'P' = 'R'): Matchup {
  return {
    year, week, team1: t1, pts1: p1, roster1: 1, team2: t2, pts2: p2, roster2: 2,
    type,
    winner: p1 >= p2 ? t1 : t2,
    loser: p1 >= p2 ? t2 : t1,
    margin: Math.abs(p1 - p2),
  }
}

const FIXTURE_MATCHUPS: Matchup[] = [
  game(2023, 1, 'Teja', 150, 'Nathan', 70),    // high score + max margin; Nathan sub-80 in a regular-season game
  game(2023, 2, 'Kerry', 100.5, 'Teja', 100),  // min margin (0.5)
  game(2023, 3, 'Teja', 120, 'Nathan', 90),    // Teja win streak starts here
  game(2024, 1, 'Teja', 130, 'Kerry', 95),
  game(2024, 2, 'Teja', 125, 'Nathan', 88),
  game(2024, 15, 'Teja', 78, 'Nathan', 75, 'P'),  // consolation (losers bracket, see brackets below)
  game(2021, 17, 'Eric', 200, 'Kerry', 50),    // in EXCLUDED_GAME_SCORES (Eric 2021 w17) → dropped entirely
]

const season = (year: number, wins: number, losses: number, pf: number, pa: number): OwnerSeason => ({
  year, wins, losses, ties: 0, pf, pa,
  finish: null, inPlayoffs: false, roster_id: 1, playoffStart: 15, totalRosters: 10,
})

const league2024: SleeperLeague = {
  league_id: 'test-2024', name: 'Test League', season: '2024', status: 'complete',
  previous_league_id: null,
  settings: { playoff_week_start: 15, leg: 17, num_teams: 10 },
}

const STATE = {
  allMatchups: FIXTURE_MATCHUPS,
  ownerSeasons: {
    Teja:   [season(2024, 12, 2, 1600, 1300)],  // best win%, high PF, best margin
    Nathan: [season(2024, 3, 11, 1100, 1450)],  // worst win%, low PF, worst margin
    Kerry:  [season(2023, 10, 0, 1250, 1150)],  // 10 games — under the >10 win% threshold
  },
  // Week 15 losers-bracket game between roster 1 (Teja) and roster 2 (Nathan)
  brackets: { 2024: { winners: [], losers: [{ r: 1, m: 1, t1: 1, t2: 2 }] } },
  rosterUserMaps: { 2024: { '1': 'Teja', '2': 'Nathan' } },
  leagues: { 2024: league2024 },
}

describe('excludeManualGames', () => {
  it('drops games listed in EXCLUDED_GAME_SCORES', () => {
    const filtered = excludeManualGames(FIXTURE_MATCHUPS)
    expect(filtered).toHaveLength(6)
    expect(filtered.some(g => g.team1 === 'Eric')).toBe(false)
  })
})

describe('buildConsolationGameKeys', () => {
  it('keys losers-bracket games at playoff_week_start + round - 1, both orderings', () => {
    const keys = buildConsolationGameKeys(STATE)
    expect(keys.has(gameKey(2024, 15, 'Teja', 'Nathan'))).toBe(true)
    expect(keys.has(gameKey(2024, 15, 'Nathan', 'Teja'))).toBe(true)
    expect(keys.size).toBe(2)
  })
})

describe('computeRecords', () => {
  const rec = computeRecords(STATE)

  it('finds scoring extremes from non-excluded games only', () => {
    expect(rec.highScore).toMatchObject({ owner: 'Teja', pts: 150, year: 2023, week: 1 })
    expect(rec.lowScore).toMatchObject({ owner: 'Nathan', pts: 70 })
    expect(rec.maxMargin.margin).toBe(80)
    expect(rec.minMargin.margin).toBe(0.5)
  })

  it('excludes consolation games from the low80 list but not regular-season games', () => {
    // 2024 w15 consolation scores (78, 75) must not appear; Nathan's 70 must
    expect(rec.low80).toHaveLength(1)
    expect(rec.low80[0]).toMatchObject({ owner: 'Nathan', pts: 70, year: 2023, week: 1 })
  })

  it('lists 140+ scores descending', () => {
    expect(rec.high140.map(s => s.pts)).toEqual([150])
  })

  it('restricts win% extremes to seasons with more than 10 games', () => {
    // Kerry is 10-0 but has only 10 games, so Teja's 12-2 is best
    expect(rec.bestWinPct).toMatchObject({ name: 'Teja', wins: 12 })
    expect(rec.worstWinPct).toMatchObject({ name: 'Nathan', losses: 11 })
  })

  it('finds season PF and margin extremes across all seasons', () => {
    expect(rec.highPF).toMatchObject({ name: 'Teja', pf: 1600 })
    expect(rec.lowPF).toMatchObject({ name: 'Nathan', pf: 1100 })
    expect(rec.bestMarginSeason.name).toBe('Teja')
    expect(rec.worstMarginSeason.name).toBe('Nathan')
  })

  it('tracks win streaks across season boundaries', () => {
    // Teja: W(2023w3) → W(2024w1) → W(2024w2) → W(2024w15) = 4 straight
    expect(rec.streaks['Teja'].maxWin).toBe(4)
    expect(rec.streaks['Teja'].winStart).toMatchObject({ year: 2023, week: 3 })
    expect(rec.streaks['Teja'].winEnd).toMatchObject({ year: 2024, week: 15 })
    expect(rec.topWinStreaks[0]).toMatchObject({ owner: 'Teja', streak: 4 })
  })

  it('tracks losing streaks the same way', () => {
    // Nathan lost every game in the fixture
    expect(rec.streaks['Nathan'].maxLoss).toBe(4)
    expect(rec.topLossStreaks[0]).toMatchObject({ owner: 'Nathan', streak: 4 })
  })

  it('derives the top rivalry from the most-played pairing', () => {
    // Teja–Nathan met 4 times (vs 2 Teja–Kerry); names come back sorted
    expect([rec.rv1, rec.rv2].sort()).toEqual(['Nathan', 'Teja'])
    expect(rec.topRivalry?.[1]).toBe(4)
  })

  it('marks the playoff blowout from playoff games only', () => {
    expect(rec.biggestPlayoffBlowout).toMatchObject({ year: 2024, week: 15, margin: 3 })
  })
})
