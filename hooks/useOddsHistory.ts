'use client'

import { BASE_PATH } from '@/lib/league'
import { oddsByWeek, type OddsByWeekInput, type WeekOdds } from '@/lib/current-season'
import { useWorker } from '@/hooks/useWorker'

const NONE: WeekOdds[] = []
// Bundled from lib/current-season/odds-worker.ts by scripts/build-workers.mjs
const start = () => new Worker(`${BASE_PATH}/workers/odds-worker.js?v=${process.env.WORKER_VERSION}`)

/**
 * Everyone's playoff odds entering each week so far, worked out in a Web
 * Worker so ten simulations don't freeze the page. `null` asks for nothing.
 * The worker lives as long as the hook, so its cache makes each poll's rerun
 * instant, and the chart keeps the last line meanwhile.
 */
export function useOddsHistory(input: OddsByWeekInput | null): WeekOdds[] {
  return useWorker(input, start, oddsByWeek, NONE, true)
}
