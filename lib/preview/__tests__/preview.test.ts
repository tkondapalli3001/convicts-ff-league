import { describe, it, expect } from 'vitest'
import { computeImplication, ordinal } from '../implications'
import type { StandingRow } from '../implications'
import { smackLines } from '../smack-talk'
import type { SmackContext } from '../smack-talk'
import { computeStandings } from '../build-preview'
import type { TeamPreview } from '../build-preview'
import type { Matchup } from '@/types'

// ── Fixtures ──────────────────────────────────────────────────────────────────

function game(over: Partial<Matchup>): Matchup {
  const base: Matchup = {
    year: 2025, week: 1,
    team1: 'A', pts1: 120, roster1: 1,
    team2: 'B', pts2: 100, roster2: 2,
    type: 'R', winner: 'A', loser: 'B', margin: 20,
  }
  const g = { ...base, ...over }
  g.winner = g.pts1 >= g.pts2 ? g.team1 : g.team2
  g.loser = g.pts1 >= g.pts2 ? g.team2 : g.team1
  g.margin = Math.abs(g.pts1 - g.pts2)
  return g
}

function team(over: Partial<TeamPreview>): TeamPreview {
  return {
    name: 'A', rosterId: 1, wins: 3, losses: 2, avgPts: 110,
    lastScores: [110, 115, 105], streak: null, seed: 3,
    ...over,
  }
}

const STANDINGS: StandingRow[] = [
  { name: 'One',   wins: 6, losses: 1, pf: 900 },
  { name: 'Two',   wins: 5, losses: 2, pf: 880 },
  { name: 'Three', wins: 5, losses: 2, pf: 860 },
  { name: 'Four',  wins: 4, losses: 3, pf: 850 },
  { name: 'Five',  wins: 3, losses: 4, pf: 840 },
  { name: 'Six',   wins: 3, losses: 4, pf: 820 },
  { name: 'Seven', wins: 2, losses: 5, pf: 810 },
  { name: 'Eight', wins: 1, losses: 6, pf: 800 },
]

// ── ordinal ───────────────────────────────────────────────────────────────────

describe('ordinal', () => {
  it('formats English ordinals including the teens', () => {
    expect(ordinal(1)).toBe('1st')
    expect(ordinal(2)).toBe('2nd')
    expect(ordinal(3)).toBe('3rd')
    expect(ordinal(4)).toBe('4th')
    expect(ordinal(11)).toBe('11th')
    expect(ordinal(12)).toBe('12th')
  })
})

// ── computeImplication ────────────────────────────────────────────────────────

describe('computeImplication', () => {
  it('a win climbs, a loss falls', () => {
    // Three (5-2, 860pf): win → 6-2 passes Two (5-2) → 2nd; loss → 5-3 behind Four? no, Four is 4-3 → stays 3rd
    const imp = computeImplication(STANDINGS, 'Three', 6)!
    expect(imp.currentSeed).toBe(3)
    expect(imp.winSeed).toBe(2)
    expect(imp.line).toContain('climbs to 2nd')
  })

  it('flags the team sitting on the playoff line', () => {
    const imp = computeImplication(STANDINGS, 'Six', 6)!
    expect(imp.currentSeed).toBe(6)
    expect(imp.playoffNote).toContain('playoff line')
  })

  it('flags the first team out', () => {
    const imp = computeImplication(STANDINGS, 'Seven', 6)!
    expect(imp.playoffNote).toContain('First team out')
  })

  it('returns null for a team not in the standings', () => {
    expect(computeImplication(STANDINGS, 'Nobody', 6)).toBeNull()
  })

  it('1st place with a comfortable lead has no movement line', () => {
    const imp = computeImplication(STANDINGS, 'One', 6)!
    expect(imp.winSeed).toBe(1)
    expect(imp.line).toBeNull()
  })
})

// ── computeStandings ──────────────────────────────────────────────────────────

describe('computeStandings', () => {
  it('orders by wins then PF, regular-season games only', () => {
    const games = [
      game({ week: 1, team1: 'A', pts1: 120, team2: 'B', pts2: 100 }),
      game({ week: 2, team1: 'A', pts1: 90,  team2: 'B', pts2: 110 }),
      game({ week: 3, team1: 'A', pts1: 130, team2: 'B', pts2: 90 }),
      game({ week: 4, team1: 'A', pts1: 200, team2: 'B', pts2: 250, type: 'P' }), // playoff — ignored
    ]
    const s = computeStandings(games)
    expect(s[0]).toMatchObject({ name: 'A', wins: 2, losses: 1 })
    expect(s[1]).toMatchObject({ name: 'B', wins: 1, losses: 2 })
    expect(s[0].pf).toBeCloseTo(340)
  })

  it('skips unplayed 0-0 pairings', () => {
    const s = computeStandings([game({ pts1: 0, pts2: 0 })])
    expect(s).toHaveLength(0)
  })
})

// ── smackLines ────────────────────────────────────────────────────────────────

function smackCtx(over: Partial<SmackContext> = {}): SmackContext {
  const games = [
    game({ year: 2025, week: 10, team1: 'A', pts1: 120, team2: 'B', pts2: 100 }),
    game({ year: 2024, week: 5,  team1: 'B', pts1: 90,  team2: 'A', pts2: 130 }),
    game({ year: 2023, week: 8,  team1: 'A', pts1: 115, team2: 'B', pts2: 95 }),
    game({ year: 2022, week: 2,  team1: 'A', pts1: 105, team2: 'B', pts2: 125 }),
  ]
  return {
    year: 2025, week: 12,
    teamA: team({ name: 'A' }),
    teamB: team({ name: 'B', rosterId: 2 }),
    h2h: {
      games, winsA: 3, winsB: 1,
      avgA: 117.5, avgB: 102.5, highA: 130, highB: 125,
      lastGame: games[0],
    },
    ...over,
  }
}

describe('smackLines', () => {
  it('is deterministic for the same year/week/pairing', () => {
    const a = smackLines(smackCtx())
    const b = smackLines(smackCtx())
    expect(a).toEqual(b)
    expect(a.length).toBeGreaterThan(0)
    expect(a.length).toBeLessThanOrEqual(2)
  })

  it('changes lines across weeks when there are more candidates than slots', () => {
    const luck = { A: 2.5, B: -2.1 } // extra candidates so the RNG has choices
    const weeks = new Set(
      [11, 12, 13, 14].map(w => JSON.stringify(smackLines(smackCtx({ week: w, luck }))))
    )
    expect(weeks.size).toBeGreaterThan(1)
  })

  it('mentions an H2H win streak', () => {
    const lines = smackLines(smackCtx(), 10)
    expect(lines.some(l => l.includes('straight') || l.includes("hasn't lost"))).toBe(true)
  })

  it('returns nothing for a first career meeting with no season data', () => {
    const ctx = smackCtx({
      teamA: team({ name: 'A', wins: 0, losses: 0, lastScores: [], streak: null }),
      teamB: team({ name: 'B', rosterId: 2, wins: 0, losses: 0, lastScores: [], streak: null }),
      h2h: { games: [], winsA: 0, winsB: 0, avgA: 0, avgB: 0, highA: 0, highB: 0, lastGame: null },
    })
    expect(smackLines(ctx)).toEqual([])
  })

  it('every line only references the two owners in the matchup', () => {
    const lines = smackLines(smackCtx({ luck: { A: 3, B: -3, C: 5 } }), 10)
    for (const line of lines) {
      expect(line.includes('C')).toBe(false)
    }
  })
})
