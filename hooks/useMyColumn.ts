'use client'

import { useEffect, useRef } from 'react'
import { useMe } from '@/hooks/useMe'

/**
 * Draft boards are wider than a phone: open them on your own column. Put
 * `scroller` on the frame that scrolls and `data-me` on your column's header.
 * The first header (the rounds) stays pinned, so your column lands just past it.
 */
export function useMyColumn() {
  const { me } = useMe()
  const scroller = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const frame = scroller.current
    const mine = frame?.querySelector<HTMLElement>('th[data-me]')
    if (!frame || !mine) return
    frame.scrollLeft = mine.offsetLeft - (frame.querySelector('th')?.offsetWidth ?? 0)
  }, [me])

  return { me, scroller }
}
