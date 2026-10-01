'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface Props<T extends string> {
  tabs: readonly { id: T; label: string }[]
  active: T
  onChange: (id: T) => void
  /** Extra content rendered after the tabs (e.g. a right-aligned action button). */
  children?: React.ReactNode
}

/**
 * Midnight Prime tab bar (design artboards 3a / 4a): underline tabs on a hairline rule —
 * active = white + 2px gold underline, inactive = muted → gold-soft on hover. Horizontally
 * scrollable on mobile, with an edge fade wherever more tabs sit off-screen and the active
 * tab kept in view. Shared across records, owners, seasons, draft, players, game log.
 */
export default function PillTabs<T extends string>({ tabs, active, onChange, children }: Props<T>) {
  const bar = useRef<HTMLDivElement>(null)
  const [more, setMore] = useState({ left: false, right: false })

  const measure = useCallback(() => {
    const el = bar.current
    if (!el) return
    const left = el.scrollLeft > 2
    const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 2
    setMore(m => (m.left === left && m.right === right ? m : { left, right }))
  }, [])

  useEffect(() => {
    const el = bar.current
    if (!el) return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    queueMicrotask(measure)
    return () => ro.disconnect()
  }, [measure])

  // Keep the active tab on screen — a tab chosen elsewhere (or the last one) can start off the edge
  useEffect(() => {
    const el = bar.current
    const tab = el?.querySelector<HTMLElement>('[aria-current="page"]')
    if (!el || !tab) return
    const pad = 24
    if (tab.offsetLeft < el.scrollLeft) el.scrollTo({ left: tab.offsetLeft - pad })
    else if (tab.offsetLeft + tab.offsetWidth > el.scrollLeft + el.clientWidth) {
      el.scrollTo({ left: tab.offsetLeft + tab.offsetWidth - el.clientWidth + pad })
    }
    // Some browsers don't fire a scroll event for a programmatic jump — re-check the fades
    queueMicrotask(measure)
  }, [active, measure])

  return (
    <div className="relative -mt-6 mb-5">
      <div
        ref={bar}
        onScroll={measure}
        className="relative flex items-center gap-1 overflow-x-auto border-b scrollbar-none"
        style={{ borderColor: 'rgba(var(--gold-rgb), 0.12)' }}
      >
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            aria-current={active === tab.id ? 'page' : undefined}
            className={[
              '-mb-px whitespace-nowrap border-b-2 px-3.5 py-3 text-[13px] font-bold uppercase tracking-[1.5px]',
              'transition-colors duration-150 active:scale-[0.98]',
              active === tab.id
                ? 'border-gold text-s-text'
                : 'border-transparent text-s-text3 hover:text-gold-soft',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
        {children}
      </div>
      {/* Edge fades — more tabs past the edge */}
      {more.left && <div aria-hidden className="pointer-events-none absolute bottom-px left-0 top-0 w-8 bg-gradient-to-r from-s-bg to-transparent" />}
      {more.right && <div aria-hidden className="pointer-events-none absolute bottom-px right-0 top-0 w-10 bg-gradient-to-l from-s-bg to-transparent" />}
    </div>
  )
}
