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
  transactionsByWeek: Record<string, Transaction[]>
}

export interface SnapshotManifest {
  generatedAt: string
  years: number[]
}

// Module-level promise caches — LeagueContext and useTransactionsData share
// the same loads instead of re-fetching the files.
let _manifest: Promise<SnapshotManifest | null> | null = null
const _seasons = new Map<number, Promise<SnapshotSeason | null>>()

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

/** All snapshot seasons listed in the manifest, skipping any that fail to load. */
export async function loadAllSnapshotSeasons(): Promise<SnapshotSeason[]> {
  const manifest = await loadSnapshotManifest()
  if (!manifest) return []
  const seasons = await Promise.all(manifest.years.map(loadSnapshotSeason))
  return seasons.filter((s): s is SnapshotSeason => s !== null)
}
