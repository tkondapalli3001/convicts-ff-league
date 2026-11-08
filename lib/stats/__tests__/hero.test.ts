import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { SnapshotSeason } from '@/lib/sources'
import { stateFromSnapshots } from '@/lib/data-processing'
import { MANUAL_CHAMPS, MANUAL_SHAME } from '@/lib/league'
import { buildCareerStats, homeHero } from '@/lib/stats'

const DATA = join(__dirname, '..', '..', '..', 'public', 'data')
const years: number[] = JSON.parse(readFileSync(join(DATA, 'manifest.json'), 'utf8')).years
const state = stateFromSnapshots(years.map(y => JSON.parse(readFileSync(join(DATA, `season-${y}.json`), 'utf8')) as SnapshotSeason))

describe("Home's hero from the snapshot (what the build bakes into the page)", () => {
  const hero = homeHero(state)
  const last = years[years.length - 1]

  it('crowns the latest snapshotted season', () => {
    expect(hero.latestYear).toBe(last)
    expect(hero.seasonCount).toBe(years.length)
    expect(hero.champName).toBe(MANUAL_CHAMPS.find(c => c.year === last)?.winner)
    expect(hero.shameName).toBe(MANUAL_SHAME.find(s => s.year === last)?.loser)
    expect(hero.runnerUpName).not.toBe('—')
    expect(hero.runnerUpName).not.toBe(hero.champName)
  })

  it('counts the whole archive', () => {
    expect(hero.yearRange).toBe(`${years[0]}–${last}`)
    expect(hero.totalGames).toBe(state.allMatchups.length)
    expect(hero.totalGames).toBeGreaterThan(0)
    expect(hero.managerCount).toBe(buildCareerStats(state).length)
  })
})
