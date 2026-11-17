'use client'

import { useEffect, useState, type ReactNode } from 'react'

type Recharts = typeof import('recharts')

let loaded: Recharts | null = null

/**
 * Draws a Recharts chart without shipping Recharts (~100 KB gzipped) with the
 * page: it loads the first time a chart is drawn, then stays for the visit.
 * Render it inside the chart's fixed-height box, so nothing moves meanwhile.
 */
export default function LazyChart({ children }: { children: (R: Recharts) => ReactNode }) {
  const [R, setR] = useState<Recharts | null>(loaded)

  useEffect(() => {
    if (R) return
    let live = true
    import('recharts').then(m => { loaded = m; if (live) setR(m) })
    return () => { live = false }
  }, [R])

  return R ? <>{children(R)}</> : null
}
