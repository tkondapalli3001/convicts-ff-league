import { SLEEPER_API } from '@/lib/league'
import { loadPlayerIndex, type PlayerIndex } from './snapshot'

export interface PlayerMetadata {
  full_name?: string
  first_name?: string
  last_name?: string
  team?: string
  position?: string
  injury_status?: string | null
}

// Player names for everything the site shows by name. Primary source is
// public/data/players.json — a ~40 KB index written by `npm run snapshot`
// covering every player in league history plus every active NFL player. If
// it's missing, fall back to Sleeper's full ~15 MB dump: the snapshot is an
// accelerator, never a dependency. The promise is cached so concurrent
// callers share one load.
let _cache: Promise<Record<string, PlayerMetadata>> | null = null

function fetchFullDump(): Promise<Record<string, PlayerMetadata>> {
  return fetch(`${SLEEPER_API}/players/nfl`, { headers: { Accept: 'application/json' } })
    .then(res => res.json() as Promise<Record<string, PlayerMetadata>>)
    .catch(() => ({}))
}

/** players.json's compact rows as player records (the build reads the file itself and calls this too). */
export function playersFromIndex(index: PlayerIndex): Record<string, PlayerMetadata> {
  const out: Record<string, PlayerMetadata> = {}
  for (const [id, [name, position, team]] of Object.entries(index)) {
    out[id] = { full_name: name, position, team: team ?? undefined }
  }
  return out
}

export function getPlayersCache(): Promise<Record<string, PlayerMetadata>> {
  _cache ??= loadPlayerIndex().then(index => (index ? playersFromIndex(index) : fetchFullDump()))
  return _cache
}

export function playerDisplayName(player: PlayerMetadata | undefined, playerId: string): string {
  if (!player) return `#${playerId}`
  return player.full_name || `${player.first_name ?? ''} ${player.last_name ?? ''}`.trim() || `#${playerId}`
}
