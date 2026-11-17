import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ownerAvatars, stateFromSnapshots } from '@/lib/data-processing'
import type { SnapshotSeason } from '@/lib/sources'
import type { LeagueState, SleeperUser } from '@/types'

let cached: LeagueState | null | undefined

/**
 * The store as the snapshot alone builds it, read at build time so pages can
 * bake their first screen into the HTML. Null if a file is missing: pages then
 * start on the spinner as they used to. Pictures also take the current league's
 * users (users-current.json, written by npm run snapshot) when they're there,
 * so an owner who changed theirs this season doesn't show the old one.
 */
export function builtState(): LeagueState | null {
  if (cached !== undefined) return cached
  try {
    const dir = join(process.cwd(), 'public', 'data')
    const { years } = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8')) as { years: number[] }
    const state = stateFromSnapshots(years.map(y => JSON.parse(readFileSync(join(dir, `season-${y}.json`), 'utf8')) as SnapshotSeason))
    let current: SleeperUser[] = []
    try { current = JSON.parse(readFileSync(join(dir, 'users-current.json'), 'utf8')) as SleeperUser[] } catch { /* older checkouts: snapshot pictures only */ }
    state.ownerAvatarMap = ownerAvatars([...state.leagueChain.map(c => state.users[c.year]), current])
    cached = state
  } catch {
    cached = null
  }
  return cached
}
