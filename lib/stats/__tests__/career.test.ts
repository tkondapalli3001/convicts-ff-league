import { describe, it, expect } from 'vitest'
import { championshipCount, buildCareerStats } from '../career'
import { h2hRecord, h2hVsAll } from '../h2h'
import type { Matchup, OwnerSeason } from '@/types'

// ─── championshipCount semantics against the real MANUAL_CHAMPS data ──────────
// These lock in the two parity traps: substring matching for shared winners
// ("Armaan & Dustin") and 0.5 weighting for half-titles.

describe('championshipCount', () => {
  it('weights shared/half titles at 0.5 via substring match', () => {
    const armaan = championshipCount('Armaan')
    const dustin = championshipCount('Dustin')
    expect(armaan % 1).toBe(0.5)
    expect(dustin % 1).toBe(0.5)
  })

  it('counts full titles as whole numbers', () => {
    expect(championshipCount('Daniyaal')).toBeGreaterThanOrEqual(2)
    expect(championshipCount('Daniyaal') % 1).toBe(0)
  })

  it('returns 0 for owners with no titles', () => {
    expect(championshipCount('Teja')).toBe(0)
  })
})

// ─── Fixture: 2 owners, 1 season, 3 games (incl. a tie) ───────────────────────

function game(week: number, t1: string, p1: number, t2: string, p2: number): Matchup {
  return {
    year: 2024, week, team1: t1, pts1: p1, roster1: 1, team2: t2, pts2: p2, roster2: 2,
    type: 'R',
    winner: p1 >= p2 ? t1 : t2,
    loser: p1 >= p2 ? t2 : t1,
    margin: Math.abs(p1 - p2),
  }
}

const FIXTURE_MATCHUPS: Matchup[] = [
  game(1, 'Teja', 120, 'Nathan', 100),   // Teja W
  game(2, 'Nathan', 90, 'Teja', 110),    // Teja W
  game(3, 'Teja', 100, 'Nathan', 100),   // tie → counts for Teja (perspective >= rule)
]

const season = (wins: number, losses: number, pf: number, pa: number): OwnerSeason => ({
  year: 2024, wins, losses, ties: 0, pf, pa,
  finish: null, inPlayoffs: false, roster_id: 1, playoffStart: 15, totalRosters: 10,
})

describe('h2hRecord', () => {
  it('counts ties as wins for the perspective owner', () => {
    const rec = h2hRecord(FIXTURE_MATCHUPS, 'Teja', 'Nathan')
    expect(rec.games).toHaveLength(3)
    expect(rec.winsA).toBe(3)
    expect(rec.winsB).toBe(0)
  })

  it('orders games most recent first and exposes lastGame', () => {
    const rec = h2hRecord(FIXTURE_MATCHUPS, 'Teja', 'Nathan')
    expect(rec.lastGame?.week).toBe(3)
    expect(rec.games[0].week).toBe(3)
  })

  it('computes averages and highs per side', () => {
    const rec = h2hRecord(FIXTURE_MATCHUPS, 'Teja', 'Nathan')
    expect(rec.avgA).toBeCloseTo((120 + 110 + 100) / 3)
    expect(rec.highA).toBe(120)
    expect(rec.highB).toBe(100)
  })

  it('returns an empty record for never-played pairs', () => {
    const rec = h2hRecord(FIXTURE_MATCHUPS, 'Teja', 'Kerry')
    expect(rec.games).toHaveLength(0)
    expect(rec.lastGame).toBeNull()
  })
})

describe('h2hVsAll', () => {
  it('skips opponents with no games and applies the same tie rule', () => {
    const rows = h2hVsAll(FIXTURE_MATCHUPS, 'Teja', ['Nathan', 'Kerry'])
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ opp: 'Nathan', w: 3, l: 0 })
  })
})

describe('buildCareerStats', () => {
  it('aggregates wins, PF, and per-game averages from seasons', () => {
    const stats = buildCareerStats({
      ownerSeasons: {
        Teja: [season(3, 0, 330, 290)],
        Nathan: [season(0, 3, 290, 330)],
      },
      allMatchups: FIXTURE_MATCHUPS,
    })
    const teja = stats.find(s => s.name === 'Teja')!
    expect(teja.allW).toBe(3)
    expect(teja.allL).toBe(0)
    expect(teja.avgPFperGame).toBeCloseTo(110)
    expect(teja.singleGameHigh).toBe(120)
    expect(teja.singleGameLow).toBe(100)
  })

  it('sorts by win% with total-PF tiebreak', () => {
    const stats = buildCareerStats({
      ownerSeasons: {
        Teja: [season(3, 0, 330, 290)],
        Nathan: [season(0, 3, 290, 330)],
      },
      allMatchups: FIXTURE_MATCHUPS,
    })
    expect(stats[0].name).toBe('Teja')
  })

  it('excludes inactive owners (Hamza, Sangram)', () => {
    const stats = buildCareerStats({
      ownerSeasons: {
        Teja: [season(1, 0, 100, 90)],
        Hamza: [season(1, 0, 100, 90)],
        Sangram: [season(1, 0, 100, 90)],
      },
      allMatchups: [],
    })
    expect(stats.map(s => s.name)).toEqual(['Teja'])
  })

  it('derives top rival from losses', () => {
    const matchups = [
      game(1, 'Teja', 90, 'Nathan', 120),
      game(2, 'Teja', 95, 'Nathan', 120),
    ]
    const stats = buildCareerStats({
      ownerSeasons: { Teja: [season(0, 2, 185, 240)], Nathan: [season(2, 0, 240, 185)] },
      allMatchups: matchups,
    })
    expect(stats.find(s => s.name === 'Teja')?.topRival).toBe('Nathan')
  })
})
