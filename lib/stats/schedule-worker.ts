// Web Worker entry: the profile's schedule chart, off the main thread. 10,000
// shuffled schedules per season is about half a second on a phone; run here,
// the profile stays responsive while the bars fill in. It runs the same
// ownerScheduleBars() as the fallback, so the bars are identical.
// Started by hooks/useScheduleBars.ts, which falls back to the main thread.

import { ownerScheduleBars, type ScheduleBar, type ScheduleBarsInput } from './schedule-bars'
import type { WorkerReply, WorkerRequest } from '@/hooks/useWorker'

const scope = self as unknown as {
  onmessage: ((e: MessageEvent<WorkerRequest<ScheduleBarsInput>>) => void) | null
  postMessage: (reply: WorkerReply<ScheduleBar[]>) => void
}

scope.onmessage = e => {
  scope.postMessage({ id: e.data.id, output: ownerScheduleBars(e.data.input) })
}
