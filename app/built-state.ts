import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { stateFromSnapshots } from '@/lib/data-processing'
import type { SnapshotSeason } from '@/lib/sources'
import type { LeagueState } from '@/types'

let cached: LeagueState | null | undefined

/**
 * The store as the snapshot alone builds it, read at build time so pages can
 * bake their first screen into the HTML. Null if a file is missing: pages then
 * start on the spinner as they used to.
 */
export function builtState(): LeagueState | null {
  if (cached !== undefined) return cached
  try {
    const dir = join(process.cwd(), 'public', 'data')
    const { years } = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8')) as { years: number[] }
    cached = stateFromSnapshots(years.map(y => JSON.parse(readFileSync(join(dir, `season-${y}.json`), 'utf8')) as SnapshotSeason))
  } catch {
    cached = null
  }
  return cached
}
