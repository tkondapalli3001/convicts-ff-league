// ─── Sleeper API Response Types ───────────────────────────────────────────────

export interface SleeperLeague {
  league_id: string
  name: string
  season: string
  status: 'pre_draft' | 'drafting' | 'in_season' | 'complete' | string
  previous_league_id: string | null
  settings: {
    playoff_week_start: number
    leg: number
    num_teams: number
    playoff_round_type?: number
  }
}

export interface SleeperUser {
  user_id: string
  display_name: string
  username: string
  avatar?: string | null
}

export interface SleeperRoster {
  roster_id: number
  owner_id: string
  settings: {
    wins: number
    losses: number
    ties: number
    fpts: number
    fpts_decimal: number
    fpts_against: number
    fpts_against_decimal: number
    ppts?: number
    ppts_decimal?: number
    waiver_budget_used?: number
  }
}

export interface SleeperMatchup {
  matchup_id: number
  roster_id: number
  points: number
  starters?: string[]
  starters_points?: number[]
  players_points?: Record<string, number>
}

export interface BracketGame {
  r: number         // round
  m: number         // match
  t1?: number       // team 1 roster_id (null if came from prev round)
  t2?: number       // team 2 roster_id (null if came from prev round)
  t1_seed?: number  // original seed of team 1
  t2_seed?: number  // original seed of team 2
  w?: number        // winner roster_id
  l?: number        // loser roster_id
  p?: number        // place (1=championship, 3=third, etc.)
}

// ─── Processed Data Types ─────────────────────────────────────────────────────

export interface Matchup {
  year: number
  week: number
  team1: string
  pts1: number
  roster1: number
  team2: string
  pts2: number
  roster2: number
  type: 'R' | 'P'
  winner: string
  loser: string
  margin: number
}

export interface OwnerSeason {
  year: number
  wins: number
  losses: number
  ties: number
  pf: number
  pa: number
  finish: number | null
  inPlayoffs: boolean
  roster_id: number
  playoffStart: number
  totalRosters: number
}

export interface LeagueChainEntry {
  id: string
  year: number
  data: SleeperLeague
}

// ─── Hardcoded Data Types ─────────────────────────────────────────────────────

export interface EarningsEntry {
  owner: string
  total: number
  y2019: number | null
  y2020: number | null
  y2021: number | null
  y2022: number | null
  y2023: number | null
  y2024: number | null
  y2025: number | null
}

export interface Champion {
  year: number
  winner: string
  seed: number | string | null
  shared?: boolean
  half?: boolean
  note?: string
}

export interface ShameLoser {
  year: number
  loser: string
  seed: number | null
  note?: string
}

// ─── Draft Types ──────────────────────────────────────────────────────────────

export interface SleeperDraft {
  draft_id: string
  league_id: string
  season: string
  type: 'snake' | 'auction'
  status: 'complete' | 'drafting' | 'pre_draft'
}

export interface DraftPick {
  player_id: string
  round: number
  pick_no: number
  draft_slot: number
  roster_id: number
  picked_by: string
  is_keeper?: boolean
  draft_id: string
  metadata: {
    position: string
    team?: string
    first_name?: string
    last_name?: string
  }
}

export interface PlayerStat {
  player_id: string
  name: string
  position: string
  team: string
  games: number
  wins: number
  winRate: number
  topOwner: string
}

// ─── Transaction Types ────────────────────────────────────────────────────────

export interface TradedPick {
  season: number
  round: number
  roster_id: number
  previous_owner_id: number
  owner_id: number
}

export interface Transaction {
  transaction_id: string
  type: 'trade' | 'waiver' | 'free_agent'
  status: 'complete' | 'pending'
  roster_ids: number[]
  leg: number
  created: number
  adds?: Record<string, number>
  drops?: Record<string, number>
  draft_picks?: TradedPick[]
  settings?: { waiver_bid?: number }
}

// ─── Global State ─────────────────────────────────────────────────────────────

export interface LeagueState {
  leagues: Record<number, SleeperLeague>
  users: Record<number, SleeperUser[]>
  rosters: Record<number, SleeperRoster[]>
  /** year → rosterId → canonical owner name */
  rosterUserMaps: Record<number, Record<string, string>>
  matchups: Record<number, Record<number, { matchups: SleeperMatchup[]; isPlayoff: boolean }>>
  brackets: Record<number, { winners: BracketGame[]; losers: BracketGame[] }>
  /** canonical owner name → user_id */
  ownerMap: Record<string, string>
  /** canonical owner name → Sleeper avatar thumb URL */
  ownerAvatarMap: Record<string, string>
  /** canonical owner name → array of per-season stats */
  ownerSeasons: Record<string, OwnerSeason[]>
  allMatchups: Matchup[]
  leagueChain: LeagueChainEntry[]
  loaded: boolean
  error: string | null
  loadingText: string
  years: number[]
}
