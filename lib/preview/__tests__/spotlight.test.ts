import { describe, it, expect } from 'vitest'
import { daddyOf, seasonHonors, seasonExtremes, weeklyMoves, injuryReport, lineupRegrets } from '../facts'
import { matchupBadges, standingBadges } from '../flair'
import { pickMatchupOfTheWeek, type MotwCandidate } from '../matchup-of-the-week'
import { smackFacts, smackPool, type SmackContext } from '../smack-talk'
import type { TeamPreview } from '../build-preview'
import type { H2HRecord } from '@/lib/stats'
import type { LeagueState, Matchup, Transaction } from '@/types'

// ── Fixtures ──────────────────────────────────────────────────────────────────

function game(year: number, week: number, t1: string, p1: number, t2: string, p2: number, type: 'R' | 'P' = 'R'): Matchup {
  return {
    year, week, team1: t1, pts1: p1, roster1: 1, team2: t2, pts2: p2, roster2: 2, type,
    winner: p1 >= p2 ? t1 : t2, loser: p1 >= p2 ? t2 : t1, margin: Math.abs(p1 - p2),
  }
}

function record(winsA: number, winsB: number, a = 'A', b = 'B'): H2HRecord {
  const games = [
    ...Array.from({ length: winsA }, (_, i) => game(2020 + i, 1, a, 120, b, 100)),
    ...Array.from({ length: winsB }, (_, i) => game(2010 + i, 1, b, 120, a, 100)),
  ]
  return { games, winsA, winsB, avgA: 0, avgB: 0, highA: 0, highB: 0, lastGame: games[0] ?? null }
}

function team(over: Partial<TeamPreview>): TeamPreview {
  return { name: 'A', rosterId: 1, wins: 1, losses: 1, avgPts: 110, lastScores: [110, 105], streak: null, seed: 5, ...over }
}

const NO_HONORS = { year: null, champs: [], toilet: null }

// ── Daddy ─────────────────────────────────────────────────────────────────────

describe('daddyOf', () => {
  it('needs 75% or better over 5+ meetings', () => {
    expect(daddyOf(record(9, 3), 'A', 'B')).toMatchObject({ daddy: 'A', son: 'B', wins: 9, losses: 3 }) // exactly 75%
    expect(daddyOf(record(1, 4), 'A', 'B')).toMatchObject({ daddy: 'B', son: 'A', wins: 4, losses: 1 })
    expect(daddyOf(record(3, 0), 'A', 'B')).toBeNull() // only 3 meetings
    expect(daddyOf(record(7, 3), 'A', 'B')).toBeNull() // 70%
  })
})

// ── Badges ────────────────────────────────────────────────────────────────────

describe('matchupBadges', () => {
  const base = {
    opponent: 'B', streak: null, daddy: null, powerRank: null, honors: NO_HONORS, injuries: null,
  } as const

  it('gives 💦 only to the Daddy side', () => {
    const daddy = daddyOf(record(9, 2), 'A', 'B')
    expect(matchupBadges({ ...base, name: 'A', daddy }).map(b => b.emoji)).toEqual(['💦'])
    expect(matchupBadges({ ...base, name: 'B', opponent: 'A', daddy })).toEqual([])
  })

  it('marks 3+ game win and loss streaks, No. 1, last season, and injured starters', () => {
    const emojis = (o: Partial<Parameters<typeof matchupBadges>[0]>) =>
      matchupBadges({ ...base, name: 'A', ...o }).map(b => b.emoji)
    expect(emojis({ streak: { type: 'W', len: 3 } })).toEqual(['🔥'])
    expect(emojis({ streak: { type: 'W', len: 2 } })).toEqual([])
    expect(emojis({ streak: { type: 'L', len: 4 } })).toEqual(['🧊'])
    expect(emojis({ powerRank: 1 })).toEqual(['👑'])
    expect(emojis({ honors: { year: 2025, champs: ['A'], toilet: null } })).toEqual(['🏆'])
    expect(emojis({ honors: { year: 2025, champs: [], toilet: 'A' } })).toEqual(['🚽'])
    expect(emojis({ injuries: { sidelined: [{ name: 'Tank Dell', status: 'IR' }], questionable: 0 } })).toEqual(['🚑'])
  })

  it('standing badges carry no matchup-only flair', () => {
    expect(standingBadges('A', { type: 'W', len: 5 }, { year: 2025, champs: ['A'], toilet: null }).map(b => b.emoji))
      .toEqual(['🔥', '🏆'])
  })
})

describe('seasonHonors', () => {
  const state = { years: [2021, 2022, 2023, 2024, 2025], brackets: {}, rosterUserMaps: {}, rosters: {} } as unknown as LeagueState

  it('names the last completed season before the given year', () => {
    expect(seasonHonors(state, 2026)).toEqual({ year: 2025, champs: ['Kerry'], toilet: 'Eric' })
  })

  it('splits a shared title', () => {
    expect(seasonHonors(state, 2023).champs).toEqual(['Armaan', 'Dustin'])
  })
})

// ── Facts ─────────────────────────────────────────────────────────────────────

describe('season facts', () => {
  it('finds the season high and low', () => {
    const { high, low } = seasonExtremes([game(2026, 1, 'A', 150, 'B', 80), game(2026, 2, 'A', 0, 'B', 0)])
    expect(high).toEqual({ owner: 'A', pts: 150, week: 1 })
    expect(low).toEqual({ owner: 'B', pts: 80, week: 1 })
  })

  it('counts completed adds and the biggest FAAB claim per owner', () => {
    const tx = (id: string, adds: Record<string, number>, bid: number, status: Transaction['status'] = 'complete'): Transaction => ({
      transaction_id: id, type: 'waiver', status, roster_ids: [1], leg: 3, created: 0, adds, settings: { waiver_bid: bid },
    })
    const lookup = (id: string) => ({ name: `Player ${id}`, position: 'WR', team: null, injury: null })
    const moves = weeklyMoves([tx('1', { p1: 1 }, 12), tx('2', { p2: 1 }, 30), tx('3', { p3: 1 }, 99, 'failed')], { 1: 'A' }, lookup)
    expect(moves.A).toEqual({ count: 2, topBid: { player: 'Player p2', bid: 30 } })
  })

  it('finds the costliest bench-for-starter swap a slot allowed', () => {
    const pos: Record<string, string> = { qb1: 'QB', rb1: 'RB', wr1: 'WR', bqb: 'QB', bwr: 'WR', ir1: 'WR' }
    const lookup = (id: string) => ({ name: id.toUpperCase(), position: pos[id] ?? '', team: null, injury: null })
    const state = {
      leagues: { 2026: { roster_positions: ['QB', 'RB', 'FLEX', 'BN', 'BN', 'IR'] } },
      rosterUserMaps: { 2026: { 1: 'A' } },
      rosters: { 2026: [{ roster_id: 1, reserve: ['ir1'] }] },
      matchups: { 2026: { 3: { isPlayoff: false, matchups: [{
        roster_id: 1, matchup_id: 1, points: 40,
        starters: ['qb1', 'rb1', 'wr1'], starters_points: [20, 15, 5],
        players: ['qb1', 'rb1', 'wr1', 'bqb', 'bwr', 'ir1'],
        // The bench QB beat the RB by 15 but can't play RB or FLEX, and the IR WR
        // never counts — so the real regret is the bench WR over the FLEX WR
        players_points: { qb1: 20, rb1: 15, wr1: 5, bqb: 30, bwr: 17, ir1: 40 },
      }] } } },
    } as unknown as LeagueState
    expect(lineupRegrets(state, 2026, 3, lookup).A).toEqual({
      benched: { name: 'BWR', pts: 17 }, started: { name: 'WR1', pts: 5 }, cost: 12,
    })
  })

  it('reports starters who are out and counts the questionable ones', () => {
    const status: Record<string, string | null> = { a: 'Out', b: 'Questionable', c: null, d: 'Questionable' }
    const lookup = (id: string) => ({ name: id.toUpperCase(), position: 'RB', team: null, injury: status[id] })
    expect(injuryReport({ 1: ['a', 'b', 'c', 'd', '0'] }, { 1: 'A' }, lookup).A)
      .toEqual({ sidelined: [{ name: 'A', status: 'Out' }], questionable: 2 })
  })
})

// ── Matchup of the Week ──────────────────────────────────────────────────────

function candidate(over: Partial<MotwCandidate>): MotwCandidate {
  return {
    teamA: team({ name: 'A' }), teamB: team({ name: 'B', rosterId: 2 }), h2h: record(4, 2),
    status: 'upcoming', ptsA: 0, ptsB: 0, projA: 110, projB: 125,
    implicationA: null, implicationB: null, daddy: null, ...over,
  }
}

describe('pickMatchupOfTheWeek', () => {
  const ctx = { week: 8, ranks: {}, careerWins: {}, honors: NO_HONORS }

  it('features the matchup with playoff stakes, a close projection, and a tied series', () => {
    const stakes = candidate({
      teamA: team({ name: 'C' }), teamB: team({ name: 'D', rosterId: 2 }),
      h2h: record(5, 5, 'C', 'D'), projA: 118, projB: 119,
      implicationA: { currentSeed: 6, winSeed: 4, lossSeed: 8, line: null, playoffNote: 'Sitting on the playoff line (6th of 6 spots)' },
    })
    const motw = pickMatchupOfTheWeek([candidate({}), stakes, candidate({ projA: 90, projB: 140 })], ctx)!
    expect(motw.index).toBe(1)
    expect(motw.reasons[0]).toBe('C: sitting on the playoff line (6th of 6 spots)')
    expect(motw.reasons.length).toBeLessThanOrEqual(3)
    expect(motw.topics).toEqual(['standings', 'proj', 'series'])
  })

  it("flags a Daddy whose status rides on the result", () => {
    const daddy = daddyOf(record(9, 3), 'A', 'B')
    const motw = pickMatchupOfTheWeek([candidate({ h2h: record(9, 3), daddy, projA: 100, projB: 140 })], ctx)!
    expect(motw.reasons.some(r => r.includes('Daddy status is on the line'))).toBe(true)
  })

  it('returns null for an empty week', () => {
    expect(pickMatchupOfTheWeek([], ctx)).toBeNull()
  })
})

// ── Ammo ─────────────────────────────────────────────────────────────────────

describe('smackPool', () => {
  const ctx = (over: Partial<SmackContext> = {}): SmackContext => ({
    year: 2026, week: 4,
    teamA: team({ name: 'Kerry', wins: 3, losses: 0, streak: { type: 'W', len: 3 } }),
    teamB: team({ name: 'Sonu', rosterId: 2, wins: 0, losses: 3, streak: { type: 'L', len: 3 } }),
    h2h: record(4, 1, 'Kerry', 'Sonu'),
    daddy: daddyOf(record(4, 1, 'Kerry', 'Sonu'), 'Kerry', 'Sonu'),
    status: 'upcoming', projA: 120, projB: 118.5,
    ranks: { Kerry: { rank: 1, movement: 4 }, Sonu: { rank: 9, movement: -3 }, Zed: { rank: 2, movement: 6 } },
    injuries: { Kerry: { sidelined: [], questionable: 0 }, Sonu: { sidelined: [{ name: 'Tank Dell', status: 'IR' }], questionable: 0 } },
    moves: { Sonu: { count: 1, topBid: { player: 'Emanuel Wilson', bid: 25 } } },
    careerWins: { Kerry: 24, Zed: 49 },
    ...over,
  })

  it('draws on history, form, rankings, projections, injuries, and the wire', () => {
    const pool = smackPool(ctx(), '2026-09-30').join('\n')
    expect(pool).toMatch(/Kerry is 4–1 all-time against Sonu|custody arrangement|80% career win rate/)
    expect(pool).toMatch(/Tank Dell/)
    expect(pool).toMatch(/\$25/)
    expect(pool).toMatch(/power rankings/)
    expect(pool).toMatch(/Coin-flip|Bring snacks/)
    expect(pool).toMatch(/25th career win/)
  })

  it('is stable within a day and reshuffles the next day', () => {
    expect(smackPool(ctx(), '2026-09-30')).toEqual(smackPool(ctx(), '2026-09-30'))
    const days = new Set(['2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02'].map(d => smackPool(ctx(), d).join('|')))
    expect(days.size).toBeGreaterThan(1)
  })

  it('keeps a live-score line in place as the score moves', () => {
    const at = (a: number, b: number) => smackPool(ctx({ status: 'live', ptsA: a, ptsB: b }), 'day')
    const first = at(40, 10)
    const later = at(65, 30)
    const idx = first.findIndex(l => l.includes('40.0'))
    expect(idx).toBeGreaterThanOrEqual(0)
    expect(later[idx]).toContain('65.0')
  })

  it('bills a playoff rematch only when the last meeting was on the title path', () => {
    const h2h = record(4, 1, 'Kerry', 'Sonu')
    const last = { ...h2h.lastGame!, year: 2025, week: 15, type: 'P' as const }
    const playoff = { ...h2h, lastGame: last, games: [last, ...h2h.games.slice(1)] }
    const lines = (champPath: Set<string>) => smackPool(ctx({ h2h: playoff, champPath }), 'd').join('\n')
    expect(lines(new Set())).not.toMatch(/title run|out of the 2025 playoffs/) // consolation game
    expect(lines(new Set([`2025|||15|||${last.team1}|||${last.team2}`]))).toMatch(/title run|out of the 2025 playoffs/)
  })

  it('tags each fact with a topic the Matchup of the Week can avoid repeating', () => {
    const topics = new Set(smackFacts(ctx(), 'd').map(f => f.topic))
    for (const t of ['daddy', 'proj', 'pr', 'injured', 'faab', 'milestone']) expect(topics.has(t)).toBe(true)
  })

  it('never brings up an owner outside the matchup', () => {
    for (const line of smackPool(ctx(), '2026-09-30')) expect(line).not.toContain('Zed')
  })
})
