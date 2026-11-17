'use client'

import { BASE_PATH } from '@/lib/league'
import { ownerScheduleBars, type ScheduleBar, type ScheduleBarsInput } from '@/lib/stats'
import { useWorker } from '@/hooks/useWorker'

const NONE: ScheduleBar[] = []
// Bundled from lib/stats/schedule-worker.ts by scripts/build-workers.mjs
const start = () => new Worker(`${BASE_PATH}/workers/schedule-worker.js?v=${process.env.WORKER_VERSION}`)

/** The profile's schedule chart bars, worked out in a Web Worker. Empty until this input's answer arrives. */
export function useScheduleBars(input: ScheduleBarsInput | null): ScheduleBar[] {
  return useWorker(input, start, ownerScheduleBars, NONE)
}
