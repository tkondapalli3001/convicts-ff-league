// The profile's "Record vs. Every Schedule" bars: an owner's wins under every
// shuffled schedule, summed across the chosen seasons. The same seeded shuffles
// `npm run uncertainty` drew, so the bars and the luck notes agree to the decimal.
// Plain data in and out, so it runs in a Web Worker (schedule-worker.ts).

import { hashSeed, rng } from '../current-season/playoff-odds'
import { scheduleSamples, scheduleSeedKey, type ScheduleGame } from './uncertainty'

export interface ScheduleBarsInput {
  owner: string
  sims: number
  /** Each chosen season's regular-season games, as `scheduleWeeks()` gives them. */
  seasons: { year: number; weeks: ScheduleGame[][] }[]
}

export interface ScheduleBar { wins: number; share: number }

/** Share of shuffled schedules (in %) at each win total, lowest first. */
export function ownerScheduleBars({ owner, sims, seasons }: ScheduleBarsInput): ScheduleBar[] {
  const total = new Float64Array(sims)
  for (const { year, weeks } of seasons) {
    const sample = scheduleSamples(weeks, sims, rng(hashSeed(scheduleSeedKey(year))))[owner]
    if (sample) for (let i = 0; i < sims; i++) total[i] += sample[i]
  }
  const counts = new Map<number, number>()
  for (const v of total) counts.set(v, (counts.get(v) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => a[0] - b[0]).map(([wins, n]) => ({ wins, share: (n / sims) * 100 }))
}
