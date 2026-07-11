import type { LeagueState, PlayerStat } from '@/types'
import type { CareerStats, H2HRecord, RecordsData } from '@/lib/stats'
import type { OwnershipEntry } from '@/lib/data-processing'

export type Intent =
  | 'h2h'
  | 'champion'
  | 'shame'
  | 'high-score'
  | 'low-score'
  | 'win-streak'
  | 'loss-streak'
  | 'luck'
  | 'earnings'
  | 'playoffs'
  | 'most-champs'
  | 'blowout'
  | 'closest-game'
  | 'drafted'
  | 'career'
  | 'player-stats'

export interface ParsedQuery {
  raw: string
  intent: Intent | null
  /** Canonical owner names in order of appearance, max 2. */
  owners: string[]
  player: { id: string; name: string } | null
  year: number | null
}

export type Answer =
  /** One big number with context — most answers. */
  | { kind: 'stat'; headline: string; value: string; detail?: string; owner?: string }
  /** Head-to-head scoreboard between two owners. */
  | { kind: 'h2h'; a: string; b: string; record: H2HRecord }
  /** Ranked rows (champions by year, earnings leaderboard, streak list…). */
  | { kind: 'list'; title: string; rows: { label: string; value: string; sub?: string; owner?: string }[] }
  /** Full manager profile card. */
  | { kind: 'manager'; name: string }
  /** Full NFL player card. */
  | { kind: 'player'; playerId: string }

export interface OwnerEntity {
  name: string
  aliases: string[]
}

export interface PlayerEntity {
  id: string
  name: string
  tokens: string[]
  games: number
}

export interface EntityIndex {
  owners: OwnerEntity[]
  players: PlayerEntity[]
}

export interface QueryContext {
  state: LeagueState
  career: CareerStats[]
  records: RecordsData
  /** Empty until the players cache lazy-loads. */
  players: PlayerStat[]
  ownership: OwnershipEntry[]
}
