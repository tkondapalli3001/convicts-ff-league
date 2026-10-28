import { describe, it, expect } from 'vitest'
import {
  careerTotals, replacementLevels, seasonTotals, splitTeamWeek, weekBridges,
  type BridgePlayer, type BridgeTotals, type WeekTeam,
} from '@/lib/stats'

const SLOTS = ['QB', 'RB', 'FLEX', 'DEF']
const REPL = { QB: 15, RB: 10, FLEX: 10, DEF: 5 }
const p = (id: string, pos: string, projected: number, actual: number, channel: BridgePlayer['channel'] = 'draft'): BridgePlayer =>
  ({ id, positions: [pos], projected, actual, channel })

const team = (owner: string, points: number, split: Partial<WeekTeam['split']> = {}, result: WeekTeam['result'] = ''): WeekTeam => ({
  owner, points, result,
  split: { lineup: 0, par: { draft: 0, pickups: 0, trades: 0 }, plan: [], ...split },
})

describe('splitTeamWeek', () => {
  it('grades lineup calls against the projected lineup and splits the rest by channel', () => {
    const roster = [p('q', 'QB', 20, 25), p('r1', 'RB', 15, 5), p('r2', 'RB', 10, 20, 'pickups'), p('w', 'WR', 12, 8, 'trades'), p('d', 'DEF', 6, 9)]
    // the owner started r2 over r1; the projections would have started q, r1, w (FLEX), d
    const split = splitTeamWeek(SLOTS, roster, 25 + 20 + 8 + 9, REPL)
    expect(split.plan.map(s => s.playerId)).toEqual(['q', 'r1', 'w', 'd'])
    expect(split.lineup).toBe(62 - (25 + 5 + 8 + 9))
    expect(split.par).toEqual({ draft: (25 - 15) + (5 - 10) + (9 - 5), pickups: 0, trades: 8 - 10 })
  })

  it('counts an empty slot as a missed pickup', () => {
    const split = splitTeamWeek(SLOTS, [p('q', 'QB', 20, 20), p('r', 'RB', 10, 10), p('w', 'WR', 10, 10)], 40, REPL)
    expect(split.plan[3]).toEqual({ slot: 'DEF', playerId: null, par: -5 })
    expect(split.par.pickups).toBe(-5)
  })
})

describe('replacementLevels', () => {
  it("takes the three players just past the league's starting demand, FLEX by share", () => {
    const lines = (n: number) => Array.from({ length: n }, (_, i) => ({ total: (n - i) * 10, games: 10 }))
    // 2 teams × 1 RB slot + 1 FLEX slot × 50% of FLEX starts = demand 3 → ranks 4-6
    const repl = replacementLevels(['RB', 'WR', 'FLEX'], 2, { RB: 1, WR: 1 }, { RB: lines(10), WR: lines(10) })
    expect(repl.RB).toBeCloseTo((7 + 6 + 5) / 3)
    expect(repl.FLEX).toBe(Math.max(repl.RB, repl.WR))
  })
})

describe('weekBridges', () => {
  it('adds up exactly to all-play expected wins', () => {
    // points = 50 (every team's replacement baseline) + lineup calls + points above replacement
    const teams = [
      team('a', 104, { lineup: 12, par: { draft: 40, pickups: 5, trades: -3 } }, 'W'),
      team('b', 75, { lineup: -5, par: { draft: 20, pickups: 10, trades: 0 } }, 'L'),
      team('c', 75, { lineup: 0, par: { draft: 10, pickups: 0, trades: 15 } }, 'T'),
      team('d', 65, { lineup: 3, par: { draft: 0, pickups: 2, trades: 10 } }, 'T'),
    ]
    for (const b of weekBridges(teams)) {
      expect(b.baseline + Object.values(b.wins).reduce((x, y) => x + y, 0)).toBeCloseTo(b.expected, 9)
    }
    const c = weekBridges(teams).find(b => b.owner === 'c')!
    expect(c.expected).toBeCloseTo((1 + 0.5) / 3, 9) // beats d, ties b
    expect(c.actual).toBe(0.5)
  })

  it('gives every win to the one part that differs from the league average', () => {
    const teams = [team('a', 120, { lineup: 20 }), team('b', 100), team('c', 100)]
    const a = weekBridges(teams).find(b => b.owner === 'a')!
    expect(a.wins.draft).toBe(0)
    expect(a.wins.lineup).toBeCloseTo(a.expected - a.baseline, 9)
  })

  it('leaves out a team that sat the week out', () => {
    expect(weekBridges([team('a', 100), team('b', 90), team('c', 0)]).map(b => b.owner)).toEqual(['a', 'b'])
  })
})

describe('seasonTotals and careerTotals', () => {
  const weeks = weekBridges([team('a', 120, { lineup: 20 }, 'W'), team('b', 100, {}, 'L')])
  it('sums a season, luck closing the gap to the record', () => {
    const s = seasonTotals([...weeks.filter(w => w.owner === 'a'), ...weeks.filter(w => w.owner === 'a')])
    expect(s.weeks).toBe(2)
    expect(s.actual).toBe(2)
    expect(s.luck).toBeCloseTo(s.actual - s.expected, 9)
  })

  it('adds careers, standard errors in quadrature', () => {
    const one = seasonTotals(weeks.filter(w => w.owner === 'a'))
    const withSe: BridgeTotals = { ...one, parts: { ...one.parts, draft: { wins: 1, se: 3, points: 0 } } }
    const career = careerTotals([withSe, { ...withSe, parts: { ...withSe.parts, draft: { wins: 2, se: 4, points: 0 } } }])
    expect(career.parts.draft.wins).toBe(3)
    expect(career.parts.draft.se).toBe(5)
  })
})
