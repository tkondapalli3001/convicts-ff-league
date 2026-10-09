import { describe, it, expect } from 'vitest'
import { careerLeaderboard, championshipCount } from '../career'
import { ownerProfile } from '../owner-profile'
import type { DraftPick, LeagueState, Matchup, OwnerSeason, SleeperDraft, SleeperLeague, SleeperMatchup } from '@/types'

// ─── Fixture: a 4-team 2024 season (Kerry beats Teja in the final, Nathan
// takes 3rd) plus a 2019 season for Teja. Locks in the Owners-page rules: the
// 3rd-place game is consolation, the manually excluded 2019 W14 game counts
// nowhere, ties count as wins, and streaks span seasons.

function game(year: number, week: number, t1: string, p1: number, t2: string, p2: number, type: 'R' | 'P' = 'R'): Matchup {
  return {
    year, week, team1: t1, pts1: p1, roster1: 1, team2: t2, pts2: p2, roster2: 2,
    type,
    winner: p1 >= p2 ? t1 : t2,
    loser: p1 >= p2 ? t2 : t1,
    margin: Math.abs(p1 - p2),
  }
}

const ALL_MATCHUPS: Matchup[] = [
  game(2019, 1, 'Teja', 100, 'Nathan', 90),
  game(2019, 14, 'Teja', 200, 'Nathan', 50),          // EXCLUDED_GAME_SCORES (Teja 2019 W14)
  game(2024, 1, 'Teja', 130, 'Kerry', 120),
  game(2024, 2, 'Nathan', 130, 'Teja', 100),
  game(2024, 3, 'Teja', 105, 'Nathan', 105),           // tie → a Teja win
  game(2024, 4, 'Kerry', 140, 'Teja', 95),
  game(2024, 15, 'Teja', 120, 'Nathan', 100, 'P'),     // semifinal
  game(2024, 15, 'Kerry', 125, 'Armaan', 90, 'P'),     // semifinal
  game(2024, 16, 'Teja', 99, 'Kerry', 101, 'P'),       // final
  game(2024, 16, 'Nathan', 150, 'Armaan', 80, 'P'),    // 3rd place — consolation
]

const season = (year: number, wins: number, losses: number, pf: number, finish: number, inPlayoffs: boolean): OwnerSeason => ({
  year, wins, losses, ties: 0, pf, pa: pf - 50, finish, inPlayoffs, roster_id: 1, playoffStart: 15, totalRosters: 4,
})

const league2024: SleeperLeague = {
  league_id: 'test-2024', name: 'Test League', season: '2024', status: 'complete', previous_league_id: null,
  settings: { playoff_week_start: 15, leg: 17, num_teams: 4 },
}

const draft: SleeperDraft = { draft_id: 'd1', league_id: 'test-2024', season: '2024', type: 'snake', status: 'complete' }
const pick = (playerId: string, first: string, last: string, position: string): DraftPick => ({
  player_id: playerId, round: 1, pick_no: 1, draft_slot: 1, roster_id: 1, picked_by: 'u1', draft_id: 'd1',
  metadata: { position, first_name: first, last_name: last },
})
const row = (rosterId: number, starters: string[], points: number[]): SleeperMatchup => ({
  matchup_id: 1, roster_id: rosterId, points: 0, starters, starters_points: points,
})

const STATE: Pick<LeagueState, 'ownerSeasons' | 'allMatchups' | 'brackets' | 'rosterUserMaps' | 'leagues' | 'draftData' | 'matchups'> = {
  allMatchups: ALL_MATCHUPS,
  ownerSeasons: {
    Teja:   [season(2019, 7, 6, 1300, 7, false), season(2024, 7, 6, 1400, 2, true)],
    Nathan: [season(2024, 6, 7, 1350, 3, true)],
    Kerry:  [season(2024, 10, 3, 1500, 1, true)],
    Armaan: [season(2024, 5, 8, 1250, 4, true)],
  },
  brackets: {
    2024: {
      winners: [
        { r: 1, m: 1, t1: 1, t2: 2, w: 1, l: 2 },
        { r: 1, m: 2, t1: 3, t2: 4, w: 3, l: 4 },
        { r: 2, m: 3, t1: 1, t2: 3, w: 3, l: 1, p: 1 },
        { r: 2, m: 4, t1: 2, t2: 4, w: 2, l: 4, p: 3 },
      ],
      losers: [],
    },
  },
  rosterUserMaps: { 2024: { '1': 'Teja', '2': 'Nathan', '3': 'Kerry', '4': 'Armaan' } },
  leagues: { 2024: league2024 },
  draftData: {
    2024: {
      draft,
      picks: [pick('4046', 'Patrick', 'Mahomes', 'QB'), pick('1234', 'Justin', 'Jefferson', 'WR'), pick('9999', 'Some', 'Defense', 'DEF')],
    },
  },
  matchups: {
    2024: {
      1: { isPlayoff: false, matchups: [row(1, ['4046', 'KC', '1234', '9999'], [20, 8, 15, 5])] },
      2: { isPlayoff: false, matchups: [row(1, ['4046', '1234'], [10, 30])] },
    },
  },
}

describe('careerLeaderboard', () => {
  it('lists active owners A–Z with career totals and average finish', () => {
    const rows = careerLeaderboard(STATE, false)
    expect(rows.map(r => r.name)).toEqual(['Armaan', 'Kerry', 'Nathan', 'Teja'])
    const teja = rows.find(r => r.name === 'Teja')!
    expect(teja).toMatchObject({ numSeasons: 2, allW: 14, allL: 12, avgPF: 1350, avgFinish: 4.5, playoffApps: 1 })
    expect(teja.winpct).toBeCloseTo(14 / 26)
    expect(teja.champs).toBe(championshipCount('Teja'))
  })

  it('counts championship-path playoff games only in the playoffs view', () => {
    const rows = careerLeaderboard(STATE, true)
    const teja = rows.find(r => r.name === 'Teja')!
    // Semifinal win + final loss; seasons become playoff appearances
    expect(teja).toMatchObject({ allW: 1, allL: 1, winpct: 0.5, avgPF: 109.5, numSeasons: 1, avgFinish: 2 })
    // Nathan's 3rd-place win is a consolation game
    expect(rows.find(r => r.name === 'Nathan')).toMatchObject({ allW: 0, allL: 1, avgPF: 100, avgFinish: 3 })
  })
})

describe('ownerProfile', () => {
  const teja = ownerProfile(STATE, 'Teja')!

  it('returns null for an owner with no seasons', () => {
    expect(ownerProfile(STATE, 'Eric')).toBeNull()
  })

  it('leaves the manual exclusions and consolation games out of every game list', () => {
    expect(teja.games).toHaveLength(7)
    expect(teja.games.some(g => g.year === 2019 && g.week === 14)).toBe(false)
    expect(ownerProfile(STATE, 'Nathan')!.games.some(g => g.week === 16)).toBe(false)
    expect(teja.h2hGames).toHaveLength(8)
    expect(teja.h2hOwners.sort()).toEqual(['Armaan', 'Kerry', 'Nathan', 'Teja'])
  })

  it('sums the career line from seasons', () => {
    expect(teja).toMatchObject({ wins: 14, losses: 12, pfPerSeason: 1350 })
    expect(teja.pfPerGame).toBeCloseTo(2700 / 26)
    expect(teja.seasons.map(s => s.year)).toEqual([2019, 2024])
  })

  it('takes the earlier season when win% ties', () => {
    expect(teja.bestSeason.year).toBe(2019)
    expect(teja.worstSeason.year).toBe(2019)
  })

  it('finds the best and worst game from counted games only', () => {
    expect(teja.bestGame).toEqual({ pts: 130, opp: 'Kerry', year: 2024, week: 1 })
    expect(teja.worstGame).toEqual({ pts: 95, opp: 'Kerry', year: 2024, week: 4 })
  })

  it('names the opponent with the most wins over the owner as top rival', () => {
    expect(teja.topRival).toEqual({ name: 'Kerry', wins: 1, losses: 2 })
  })

  it('counts a tie as a win and runs win streaks across seasons', () => {
    expect(teja.winStreak.length).toBe(2)
    expect([teja.winStreak.start?.year, teja.winStreak.start?.week]).toEqual([2019, 1])
    expect([teja.winStreak.end?.year, teja.winStreak.end?.week]).toEqual([2024, 1])
  })

  it('reads the finals record from the championship game', () => {
    expect(teja.finals).toEqual({ wins: 0, losses: 1 })
    expect(ownerProfile(STATE, 'Kerry')!.finals).toEqual({ wins: 1, losses: 0 })
    expect(teja.byes).toBe(0)
  })

  it('sums starter points per player and leaves defenses out', () => {
    expect(teja.topScorers).toEqual([
      { name: 'Justin Jefferson', pos: 'WR', pts: 45 },
      { name: 'Patrick Mahomes', pos: 'QB', pts: 30 },
    ])
  })
})
