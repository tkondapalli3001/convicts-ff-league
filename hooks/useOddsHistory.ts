'use client'

import { useEffect, useRef, useState } from 'react'
import { oddsByWeek, type OddsByWeekInput, type WeekOdds } from '@/lib/current-season'
import type { OddsReply, OddsRequest } from '@/lib/current-season/odds-worker'

/**
 * Everyone's playoff odds entering each week so far, worked out in a Web
 * Worker so ten simulations don't freeze the page. `null` asks for nothing.
 * The worker lives as long as the hook, so its cache makes each poll's rerun
 * instant. If a worker can't start, the same function runs here instead.
 */
export function useOddsHistory(input: OddsByWeekInput | null): WeekOdds[] {
  const [odds, setOdds] = useState<WeekOdds[]>([])
  const worker = useRef<Worker | null>(null)
  const broken = useRef(false)
  const latest = useRef(0)

  useEffect(() => () => worker.current?.terminate(), [])

  useEffect(() => {
    if (!input) return
    const id = ++latest.current
    // Off the worker: after paint, so at least the table is up first
    const onMainThread = () => window.setTimeout(() => { if (id === latest.current) setOdds(oddsByWeek(input)) }, 0)

    if (broken.current || typeof Worker === 'undefined') { onMainThread(); return }
    try {
      worker.current ??= new Worker(new URL('../lib/current-season/odds-worker.ts', import.meta.url), { type: 'module' })
      worker.current.onmessage = (e: MessageEvent<OddsReply>) => { if (e.data.id === latest.current) setOdds(e.data.odds) }
      worker.current.onerror = () => {
        broken.current = true
        worker.current?.terminate()
        worker.current = null
        onMainThread()
      }
      worker.current.postMessage({ id, input } satisfies OddsRequest)
    } catch {
      broken.current = true
      onMainThread()
    }
  }, [input])

  return input ? odds : []
}
