'use client'

import { useEffect, useRef, useState } from 'react'

export interface WorkerRequest<I> { id: number; input: I }
export interface WorkerReply<O> { id: number; output: O }

/**
 * `compute(input)`, worked out in a Web Worker so heavy simulations don't
 * freeze the page. `null` asks for nothing. `start` makes the worker from its
 * bundle in public/workers/ (scripts/build-workers.mjs; Turbopack can't bundle
 * workers). Pass module-level `start`, `compute` and `empty`, not inline ones.
 * The worker lives as long as the hook, so any cache it keeps carries between
 * inputs. If a worker can't start, `compute` runs here instead, after paint.
 * Until this input's answer arrives it returns `empty`, or with `keepStale`
 * the last answer (so a chart doesn't blink on every poll).
 */
export function useWorker<I, O>(input: I | null, start: () => Worker, compute: (input: I) => O, empty: O, keepStale = false): O {
  const [result, setResult] = useState<{ input: I; output: O } | null>(null)
  const worker = useRef<Worker | null>(null)
  const broken = useRef(false)
  const latest = useRef(0)

  useEffect(() => () => worker.current?.terminate(), [])

  useEffect(() => {
    if (!input) return
    const id = ++latest.current
    const done = (output: O) => { if (id === latest.current) setResult({ input, output }) }
    // Off the worker: after paint, so at least the rest of the page is up first
    const onMainThread = () => window.setTimeout(() => { if (id === latest.current) done(compute(input)) }, 0)

    if (broken.current || typeof Worker === 'undefined') { onMainThread(); return }
    try {
      worker.current ??= start()
      worker.current.onmessage = (e: MessageEvent<WorkerReply<O>>) => { if (e.data.id === id) done(e.data.output) }
      worker.current.onerror = () => {
        broken.current = true
        worker.current?.terminate()
        worker.current = null
        onMainThread()
      }
      worker.current.postMessage({ id, input } satisfies WorkerRequest<I>)
    } catch {
      broken.current = true
      onMainThread()
    }
  }, [input, start, compute])

  if (!input || !result) return empty
  return result.input === input || keepStale ? result.output : empty
}
