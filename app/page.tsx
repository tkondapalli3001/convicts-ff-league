import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import HomePage from '@/components/home/HomePage'
import { stateFromSnapshots } from '@/lib/data-processing'
import { homeHero, type HomeHero } from '@/lib/stats'
import type { SnapshotSeason } from '@/lib/sources'

// Home's hero from the snapshot, worked out at build time so it's in the HTML
// and paints before any data loads. If a file is missing, the page starts on
// the spinner as it used to.
function builtHero(): HomeHero | null {
  try {
    const dir = join(process.cwd(), 'public', 'data')
    const { years } = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8')) as { years: number[] }
    return homeHero(stateFromSnapshots(years.map(y => JSON.parse(readFileSync(join(dir, `season-${y}.json`), 'utf8')) as SnapshotSeason)))
  } catch {
    return null
  }
}

export default function Page() {
  return <HomePage builtHero={builtHero()} />
}
