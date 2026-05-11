import { SLEEPER_API } from '@/lib/constants'

export interface PlayerMetadata {
  full_name?: string
  first_name?: string
  last_name?: string
  team?: string
  position?: string
}

let _cache: Record<string, PlayerMetadata> | null = null

export async function getPlayersCache(): Promise<Record<string, PlayerMetadata>> {
  if (_cache) return _cache
  try {
    const res = await fetch(`${SLEEPER_API}/players/nfl`, { headers: { Accept: 'application/json' } })
    _cache = await res.json()
  } catch {
    _cache = {}
  }
  return _cache!
}

export function playerDisplayName(player: PlayerMetadata | undefined, playerId: string): string {
  if (!player) return `#${playerId}`
  return player.full_name || `${player.first_name ?? ''} ${player.last_name ?? ''}`.trim() || `#${playerId}`
}
