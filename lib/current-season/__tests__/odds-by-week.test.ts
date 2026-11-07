import { describe, it, expect } from 'vitest'
import { oddsByWeek, stakesEntering } from '../odds-by-week'
import type { ScheduleGame } from '../playoff-odds'
import type { Matchup } from '@/types'

const TEAMS = ['Ann', 'Bo', 'Cy', 'Di', 'Ed', 'Flo']
const REG_END = 5

/** Round robin, one round per week. */
function schedule(): Record<number, ScheduleGame[]> {
  const out: Record<number, ScheduleGame[]> = {}
  const rot = [...TEAMS]
  for (let w = 1; w <= REG_END; w++) {
    out[w] = []
    for (let i = 0; i < rot.length / 2; i++) out[w].push({ week: w, a: rot[i], b: rot[rot.length - 1 - i] })
    rot.splice(1, 0, rot.pop()!)
  }
  return out
}

/** Weeks 1..n final: the team listed first always scores more. */
function finals(n: number): Matchup[] {
  return Object.values(schedule()).flat().filter(g => g.week <= n).map(g => ({
    year: 2030, week: g.week, team1: g.a, team2: g.b, pts1: 130, pts2: 100, roster1: 0, roster2: 0,
    type: 'R', winner: g.a, loser: g.b, margin: 30,
  }))
}

const HISTORY = Array.from({ length: 200 }, (_, i) => ({ season: 2029, team: TEAMS[i % 6], pts: 100 + ((i * 37) % 50) }))
const base = { season: 2030, schedule: schedule(), history: HISTORY, playoffSpots: 4, regEnd: REG_END, teamNames: TEAMS }

describe('oddsByWeek', () => {
  it('has a point entering every week so far, and the last one is the odds the tab shows', () => {
    const line = oddsByWeek({ ...base, finalGames: finals(3), throughWeek: 4 })
    expect(line.map(p => p.week)).toEqual([1, 2, 3, 4])
    const today = stakesEntering({ ...base, finalGames: finals(3), week: 4 })
    for (const t of TEAMS) expect(line[3].odds[t]).toBe(today[t].odds)
  })

  it('uses only the games before each week', () => {
    // Entering week 2 sees only week 1, however many weeks are final now
    const later = oddsByWeek({ ...base, finalGames: finals(3), throughWeek: 4 })
    const then = oddsByWeek({ ...base, finalGames: finals(1), throughWeek: 2 })
    expect(later[1].odds).toEqual(then[1].odds)
  })

  it('starts everyone level before a game is played', () => {
    const [week1] = oddsByWeek({ ...base, finalGames: [], throughWeek: 1 })
    const odds = Object.values(week1.odds)
    expect(Math.max(...odds) - Math.min(...odds)).toBeLessThan(0.05)
  })

  it('stops at the regular season and draws nothing without the whole schedule', () => {
    expect(oddsByWeek({ ...base, finalGames: finals(5), throughWeek: 9 })).toHaveLength(REG_END)
    const gap = { ...schedule() }
    delete gap[5]
    expect(oddsByWeek({ ...base, schedule: gap, finalGames: finals(2), throughWeek: 3 })).toEqual([])
  })
})
