import { describe, it, expect } from 'vitest'
import { weekStatus, lastFinalWeek, withLiveSeason, EMPTY_OVERLAY } from '../live'
import { getDefaultWeek, buildWeekPreviews } from '../build-preview'
import { buildTeamRosters, playerLookup } from '../rosters'
import { scoreStats, projectTeam } from '../projections'
import type { WeekProjections } from '../projections'
import type { LeagueState, SleeperLeague, SleeperMatchup, SleeperRoster } from '@/types'

// ─── Fixture: a 4-team live season in week 3. Weeks 1–2 are final; a Thursday
// game has put points on the board for week 3.

function row(roster_id: number, matchup_id: number, points: number, extra: Partial<SleeperMatchup> = {}): SleeperMatchup {
  return { roster_id, matchup_id, points, ...extra }
}

function league(over: Partial<SleeperLeague['settings']> = {}, status = 'in_season'): SleeperLeague {
  return {
    league_id: 'L2026', name: 'Test', season: '2026', status, previous_league_id: null,
    settings: { playoff_week_start: 15, leg: 3, last_scored_leg: 2, num_teams: 4, ...over },
    roster_positions: ['QB', 'RB', 'FLEX', 'BN', 'BN', 'IR'],
  }
}

function roster(roster_id: number, wins: number, losses: number, fpts: number, extra: Partial<SleeperRoster> = {}): SleeperRoster {
  return {
    roster_id, owner_id: `u${roster_id}`,
    settings: { wins, losses, ties: 0, fpts, fpts_decimal: 0, fpts_against: 0, fpts_against_decimal: 0 },
    ...extra,
  }
}

function makeState(week3: SleeperMatchup[], lg: SleeperLeague = league()): LeagueState {
  return {
    leagues: { 2026: lg },
    users: {},
    rosters: {
      2026: [
        roster(1, 2, 0, 250, { reserve: ['p9'] }),
        roster(2, 0, 2, 200),
        roster(3, 1, 1, 230),
        roster(4, 1, 1, 210),
      ],
    },
    rosterUserMaps: { 2026: { 1: 'Teja', 2: 'Dustin', 3: 'Kerry', 4: 'Eric' } },
    matchups: {
      2026: {
        1: { isPlayoff: false, matchups: [row(1, 1, 130), row(2, 1, 100), row(3, 2, 120), row(4, 2, 110)] },
        2: { isPlayoff: false, matchups: [row(1, 1, 120), row(3, 1, 110), row(2, 2, 100), row(4, 2, 105)] },
        3: { isPlayoff: false, matchups: week3 },
      },
    },
    brackets: {},
    ownerMap: {},
    ownerAvatarMap: {},
    ownerSeasons: {},
    allMatchups: [],
    leagueChain: [{ id: 'L2026', year: 2026, data: lg }],
    draftData: {},
    loaded: true,
    error: null,
    loadingText: '',
    years: [],
  }
}

const THURSDAY = [
  row(1, 1, 18.4, { starters: ['p1', 'p2', 'p3'], players: ['p1', 'p2', 'p3', 'p4', 'p9'], players_points: { p1: 18.4, p2: 0, p3: 0, p4: 0 } }),
  row(4, 1, 0),
  row(2, 2, 0),
  row(3, 2, 0),
]
const KICKOFF_PENDING = THURSDAY.map(m => ({ ...m, points: 0 }))

describe('week status', () => {
  it('final through last_scored_leg, live once points are on the board', () => {
    const s = makeState(THURSDAY)
    expect(lastFinalWeek(s, 2026)).toBe(2)
    expect(weekStatus(s, 2026, 2)).toBe('final')
    expect(weekStatus(s, 2026, 3)).toBe('live')
  })

  it('upcoming before kickoff', () => {
    expect(weekStatus(makeState(KICKOFF_PENDING), 2026, 3)).toBe('upcoming')
  })

  it('every week is final once the season is complete', () => {
    const s = makeState(THURSDAY, league({ leg: 17, last_scored_leg: 17 }, 'complete'))
    expect(lastFinalWeek(s, 2026)).toBe(3)
    expect(weekStatus(s, 2026, 3)).toBe('final')
  })

  it('opens on the in-progress week', () => {
    expect(getDefaultWeek(makeState(THURSDAY), 2026)).toBe(3)
  })
})

describe('buildWeekPreviews on a live week', () => {
  it('marks the week live and builds records from final weeks only', () => {
    const [p] = buildWeekPreviews(makeState(THURSDAY), 2026, 3)
    expect(p.status).toBe('live')
    // Teja is 2–0 after weeks 1–2; the partial week-3 score doesn't count
    const teja = p.teamA.name === 'Teja' ? p.teamA : p.teamB
    expect([teja.wins, teja.losses]).toEqual([2, 0])
  })
})

describe('withLiveSeason', () => {
  it('overlays fresh league settings and weekly rows on the global state', () => {
    const s = makeState(KICKOFF_PENDING)
    const merged = withLiveSeason(s, 2026, {
      ...EMPTY_OVERLAY,
      league: league({ leg: 3, last_scored_leg: 3 }),
      matchups: { 3: THURSDAY },
    })
    expect(merged.matchups[2026][3].matchups).toBe(THURSDAY)
    expect(merged.matchups[2026][1]).toBe(s.matchups[2026][1])
    expect(weekStatus(merged, 2026, 3)).toBe('final')
    // The source state is untouched
    expect(s.matchups[2026][3].matchups).toBe(KICKOFF_PENDING)
  })
})

describe('buildTeamRosters', () => {
  const projections: WeekProjections = {
    points: { p1: 22.1, p2: 14.5, p3: 9.4, p4: 6 },
    players: {
      p1: { name: 'Lamar Jackson', position: 'QB', team: 'BAL', injury: null },
      p2: { name: 'Bijan Robinson', position: 'RB', team: 'ATL', injury: 'Questionable' },
      p3: { name: 'Puka Nacua', position: 'WR', team: 'LAR', injury: null },
      p4: { name: 'Tyler Warren', position: 'TE', team: 'IND', injury: null },
      p9: { name: 'Tank Dell', position: 'WR', team: 'HOU', injury: 'IR' },
    },
    games: {
      BAL: { opponent: 'DAL', date: '2026-09-24' },
      ATL: { opponent: 'CAR', date: '2026-09-27' },
      LAR: { opponent: 'SF', date: '2026-09-27' },
    },
  }
  const now = new Date('2026-09-26T12:00:00')

  function tejaRoster(week3: SleeperMatchup[], status: 'live' | 'upcoming') {
    const s = makeState(week3)
    const lookup = playerLookup(s, 2026, projections, {})
    return buildTeamRosters(s, 2026, 3, status, projections, lookup, now).find(t => t.owner === 'Teja')!
  }

  it('labels lineup slots and splits bench from IR', () => {
    const t = tejaRoster(THURSDAY, 'live')
    expect(t.starters.map(s => [s.slot, s.player?.name])).toEqual([
      ['QB', 'Lamar Jackson'], ['RB', 'Bijan Robinson'], ['FLEX', 'Puka Nacua'],
    ])
    expect(t.bench.map(p => p.id)).toEqual(['p4'])
    expect(t.reserve.map(p => p.name)).toEqual(['Tank Dell'])
    expect(t.opponent).toBe('Eric')
    expect([t.standing, t.wins, t.losses]).toEqual([1, 2, 0])
  })

  it('totals starter projections and live points', () => {
    const t = tejaRoster(THURSDAY, 'live')
    expect(t.projTotal).toBeCloseTo(46)
    expect(t.ptsTotal).toBeCloseTo(18.4)
  })

  it('shows points only for games already played', () => {
    const t = tejaRoster(THURSDAY, 'live')
    const pts = Object.fromEntries(t.starters.map(s => [s.player!.id, s.player!.pts]))
    // Thursday's QB has scored; Sunday's players show nothing rather than 0
    expect(pts).toEqual({ p1: 18.4, p2: null, p3: null })
    expect(t.starters[0].player!.game).toBe('vs DAL · Thu')
  })

  it('marks teams without a game this week as on bye', () => {
    const t = tejaRoster(THURSDAY, 'live')
    expect(t.bench[0].game).toBe('BYE')
    expect(t.bench[0].pts).toBeNull()
  })

  it('hides points entirely before kickoff', () => {
    const t = tejaRoster(KICKOFF_PENDING, 'upcoming')
    expect(t.ptsTotal).toBeNull()
    expect(t.starters.every(s => s.player!.pts === null)).toBe(true)
  })
})

describe('projections', () => {
  it('scores projected stats with the league settings', () => {
    // Half-PPR, 4-pt passing TDs, −2 interceptions
    const scoring = { pass_yd: 0.04, pass_td: 4, pass_int: -2, rec: 0.5, rec_yd: 0.1 }
    expect(scoreStats({ pass_yd: 250, pass_td: 2, pass_int: 1, pts_half_ppr: 99 }, scoring)).toBeCloseTo(16)
    expect(scoreStats({ rec: 6, rec_yd: 80 }, scoring)).toBeCloseTo(11)
  })

  it('projects a lineup only when most of it is covered', () => {
    const proj: WeekProjections = { points: { a: 10, b: 12 }, players: {}, games: {} }
    expect(projectTeam(['a', 'b', '0'], proj)).toBe(22)
    expect(projectTeam(['a', 'x', 'y', 'z'], proj)).toBeNull()
  })
})
