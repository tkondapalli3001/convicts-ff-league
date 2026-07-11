import { describe, it, expect } from 'vitest'
import { resolveAnswer } from '../resolvers'
import { computeRecords } from '@/lib/stats'
import type { ParsedQuery, QueryContext } from '../types'
import type { Matchup, OwnerSeason } from '@/types'

// ─── Fixture for the margin + draft intents (blowout / closest-game / drafted) ──

function game(year: number, week: number, t1: string, p1: number, t2: string, p2: number): Matchup {
  return {
    year, week, team1: t1, pts1: p1, roster1: 1, team2: t2, pts2: p2, roster2: 2,
    type: 'R',
    winner: p1 >= p2 ? t1 : t2,
    loser: p1 >= p2 ? t2 : t1,
    margin: Math.abs(p1 - p2),
  }
}

const MATCHUPS: Matchup[] = [
  game(2023, 1, 'Teja', 150, 'Nathan', 70),    // margin 80 — biggest blowout
  game(2023, 2, 'Kerry', 100.5, 'Teja', 100),  // margin 0.5 — closest game
  game(2024, 1, 'Teja', 130, 'Kerry', 95),     // margin 35
  game(2024, 3, 'Nathan', 0, 'Teja', 0),       // unplayed — must never win "closest"
]

const season = (year: number): OwnerSeason => ({
  year, wins: 1, losses: 1, ties: 0, pf: 200, pa: 200,
  finish: null, inPlayoffs: false, roster_id: 1, playoffStart: 15, totalRosters: 10,
})

const OWNERSHIP = [{
  player_id: '4034', name: 'Justin Jefferson', position: 'WR', team: 'MIN',
  picks: [
    { owner: 'Teja', year: 2023, round: 1, pickNo: 3 },
    { owner: 'Kerry', year: 2024, round: 1, pickNo: 1 },
  ],
  avgPickNo: 2,
}]

const ctx = {
  state: { allMatchups: MATCHUPS, years: [2023, 2024] },
  career: [],
  records: computeRecords({
    allMatchups: MATCHUPS,
    ownerSeasons: { Teja: [season(2023)], Nathan: [season(2023)], Kerry: [season(2023)] },
    brackets: {}, rosterUserMaps: {}, leagues: {},
  }),
  players: [],
  ownership: OWNERSHIP,
} as unknown as QueryContext

const q = (over: Partial<ParsedQuery>): ParsedQuery =>
  ({ raw: '', intent: null, owners: [], player: null, year: null, ...over })

describe('blowout resolver', () => {
  it('unscoped: ranks blowouts by margin', () => {
    const a = resolveAnswer(q({ intent: 'blowout' }), ctx)
    expect(a).toMatchObject({ kind: 'list', title: 'Biggest Blowouts' })
    if (a?.kind !== 'list') throw new Error('expected list')
    expect(a.rows[0]).toMatchObject({ label: 'Teja over Nathan', value: '+80.00' })
  })

  it('scoped to a pairing: single stat over their games only', () => {
    const a = resolveAnswer(q({ intent: 'blowout', owners: ['Teja', 'Kerry'] }), ctx)
    expect(a).toMatchObject({ kind: 'stat', value: '35.00', owner: 'Teja' })
  })

  it('scoped to a year', () => {
    const a = resolveAnswer(q({ intent: 'blowout', year: 2023 }), ctx)
    expect(a).toMatchObject({ kind: 'stat', value: '80.00' })
  })
})

describe('closest-game resolver', () => {
  it('finds the smallest margin and ignores unplayed 0–0 games', () => {
    const a = resolveAnswer(q({ intent: 'closest-game' }), ctx)
    if (a?.kind !== 'list') throw new Error('expected list')
    expect(a.rows[0]).toMatchObject({ value: '±0.50', owner: 'Kerry' })
    expect(a.rows).toHaveLength(3) // the 0–0 game is excluded entirely
  })
})

describe('drafted resolver', () => {
  const jj = { id: '4034', name: 'Justin Jefferson' }

  it('lists all picks newest first', () => {
    const a = resolveAnswer(q({ intent: 'drafted', player: jj }), ctx)
    if (a?.kind !== 'list') throw new Error('expected list')
    expect(a.rows.map(r => r.value)).toEqual(['Kerry', 'Teja'])
  })

  it('narrows to a single stat with a year', () => {
    const a = resolveAnswer(q({ intent: 'drafted', player: jj, year: 2023 }), ctx)
    expect(a).toMatchObject({ kind: 'stat', value: 'Teja' })
  })

  it('returns null for unknown players or before ownership loads', () => {
    expect(resolveAnswer(q({ intent: 'drafted', player: { id: '1', name: 'Nobody' } }), ctx)).toBeNull()
    const emptyCtx = { ...ctx, ownership: [] } as QueryContext
    expect(resolveAnswer(q({ intent: 'drafted', player: jj }), emptyCtx)).toBeNull()
  })
})
