import { describe, it, expect } from 'vitest'
import { bestLineup, startingSlots } from '../lineups'

const p = (id: string, positions: string[], points: number) => ({ id, positions, points })
const SLOTS = ['QB', 'RB', 'RB', 'WR', 'WR', 'TE', 'FLEX', 'K', 'DEF']

describe('startingSlots', () => {
  it('drops bench, IR, and taxi spots', () => {
    expect(startingSlots(['QB', 'RB', 'FLEX', 'BN', 'BN', 'IR', 'TAXI'])).toEqual(['QB', 'RB', 'FLEX'])
  })
})

describe('bestLineup', () => {
  it('puts the best leftover RB, WR, or TE at FLEX', () => {
    const roster = [
      p('qb', ['QB'], 20), p('rb1', ['RB'], 15), p('rb2', ['RB'], 12), p('rb3', ['RB'], 11),
      p('wr1', ['WR'], 18), p('wr2', ['WR'], 9), p('wr3', ['WR'], 8), p('te', ['TE'], 7), p('k', ['K'], 5), p('def', ['DEF'], 6),
    ]
    const best = bestLineup(SLOTS, roster)
    expect(best.points).toBe(20 + 15 + 12 + 18 + 9 + 7 + 11 + 5 + 6)
    expect(best.slots.find(s => s.slot === 'FLEX')?.playerId).toBe('rb3')
  })

  it('uses a dual-position player wherever he adds the most', () => {
    // The DB/WR plays WR, freeing nobody else to start
    const roster = [p('qb', ['QB'], 10), p('wr1', ['WR'], 9), p('hunter', ['DB', 'WR'], 14), p('rb', ['RB'], 3)]
    const best = bestLineup(['QB', 'WR', 'WR', 'FLEX'], roster)
    expect(best.points).toBe(10 + 9 + 14 + 3)
  })

  it('leaves a slot empty only when nobody eligible is left', () => {
    const best = bestLineup(['QB', 'TE'], [p('qb', ['QB'], 10)])
    expect(best.points).toBe(10)
    expect(best.slots).toEqual([{ slot: 'QB', playerId: 'qb' }, { slot: 'TE', playerId: null }])
  })

  it('starts the only eligible player even at negative points, as Sleeper does', () => {
    expect(bestLineup(['DEF'], [p('def', ['DEF'], -3)]).points).toBe(-3)
  })

  it('never starts a player twice', () => {
    const best = bestLineup(['RB', 'FLEX'], [p('rb', ['RB'], 20)])
    expect(best.points).toBe(20)
    expect(best.slots.filter(s => s.playerId === 'rb')).toHaveLength(1)
  })
})
