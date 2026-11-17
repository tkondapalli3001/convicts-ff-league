// Web Worker entry: the odds-by-week chart's simulations, off the main thread.
// One 10,000-season simulation per week played is seconds of work on a phone;
// run here, the page stays responsive while the chart fills in. It runs the
// same oddsByWeek() as everything else, so the numbers are identical.
// Started by hooks/useOddsHistory.ts, which falls back to the main thread.

import { oddsByWeek, type OddsByWeekInput, type WeekOdds } from './odds-by-week'
import type { WorkerReply, WorkerRequest } from '@/hooks/useWorker'

const scope = self as unknown as {
  onmessage: ((e: MessageEvent<WorkerRequest<OddsByWeekInput>>) => void) | null
  postMessage: (reply: WorkerReply<WeekOdds[]>) => void
}

scope.onmessage = e => {
  scope.postMessage({ id: e.data.id, output: oddsByWeek(e.data.input) })
}
