// Loader for the static season snapshots produced by scripts/snapshot-history.mjs.
//
// Completed seasons are immutable, so they ship with the site as JSON under
// public/data/ and load instantly — no Sleeper round-trips. Every function
// here returns null on any failure: the snapshot is an accelerator, never a
// dependency. Callers must fall back to live fetching when it's missing.

import { BASE_PATH } from '@/lib/constants'
import type {
  SleeperLeague, SleeperUser, SleeperRoster, SleeperMatchup,
  BracketGame, SleeperDraft, DraftPick, Transaction,
} from '@/types'

export interface SnapshotSeason {
  year: number
  league: SleeperLeague
  users: SleeperUser[]
  rosters: SleeperRoster[]
  matchupsByWeek: Record<string, SleeperMatchup[]>
  winnersBracket: BracketGame[]
  losersBracket: BracketGame[]
  draft: { draft: SleeperDraft; picks: DraftPick[] } | null
}

export interface SnapshotManifest {
  generatedAt: string
  years: number[]
}

/** player_id → [display name, position, NFL team]. */
export type PlayerIndex = Record<string, [string, string, string | null]>

// Module-level promise caches — LeagueContext and useTransactionsData share
// the same loads instead of re-fetching the files.
let _manifest: Promise<SnapshotManifest | null> | null = null
const _seasons = new Map<number, Promise<SnapshotSeason | null>>()
const _transactions = new Map<number, Promise<Record<string, Transaction[]> | null>>()
let _players: Promise<PlayerIndex | null> | null = null

async function fetchJsonOrNull<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE_PATH}${path}`)
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

export function loadSnapshotManifest(): Promise<SnapshotManifest | null> {
  if (!_manifest) _manifest = fetchJsonOrNull<SnapshotManifest>('/data/manifest.json')
  return _manifest
}

export function loadSnapshotSeason(year: number): Promise<SnapshotSeason | null> {
  let p = _seasons.get(year)
  if (!p) {
    p = fetchJsonOrNull<SnapshotSeason>(`/data/season-${year}.json`)
    _seasons.set(year, p)
  }
  return p
}

/**
 * One season's transactions, week → moves. Split out of the season file
 * because only Players → Transactions needs them — every other page skips
 * the download.
 */
export function loadSnapshotTransactions(year: number): Promise<Record<string, Transaction[]> | null> {
  let p = _transactions.get(year)
  if (!p) {
    p = fetchJsonOrNull<Record<string, Transaction[]>>(`/data/transactions-${year}.json`)
    _transactions.set(year, p)
  }
  return p
}

/** Trimmed player-name index written by `npm run snapshot` (see lib/players-cache.ts). */
export function loadPlayerIndex(): Promise<PlayerIndex | null> {
  _players ??= fetchJsonOrNull<{ players: PlayerIndex }>('/data/players.json').then(d => d?.players ?? null)
  return _players
}

/** All snapshot seasons listed in the manifest, skipping any that fail to load. */
export async function loadAllSnapshotSeasons(): Promise<SnapshotSeason[]> {
  const manifest = await loadSnapshotManifest()
  if (!manifest) return []
  const seasons = await Promise.all(manifest.years.map(loadSnapshotSeason))
  return seasons.filter((s): s is SnapshotSeason => s !== null)
}
