'use client'

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CircleHelp } from 'lucide-react'

const GAP = 8
const EDGE = 8
const HAIRLINE = '1px solid rgba(var(--gold-rgb), 0.24)'

/**
 * A small ? icon that explains a term in a popover: hover or keyboard focus on
 * desktop, tap on touch screens. Portaled to document.body — a table's
 * overflow scroller or the page's fade-in transform would otherwise clip it.
 */
export default function InfoTip({ term, children }: { term: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const btn = useRef<HTMLButtonElement>(null)
  const tip = useRef<HTMLDivElement>(null)
  const arrow = useRef<HTMLSpanElement>(null)
  const lastPointer = useRef('mouse')
  const id = useId()

  // The box renders off-screen first; once it's measurable, sit it above the
  // icon (below if there's no room), clamped to the viewport
  useLayoutEffect(() => {
    const b = btn.current, t = tip.current, a = arrow.current
    if (!open || !b || !t || !a) return
    const r = b.getBoundingClientRect()
    const center = r.left + r.width / 2
    const left = Math.min(Math.max(EDGE, center - t.offsetWidth / 2), window.innerWidth - t.offsetWidth - EDGE)
    const above = r.top >= t.offsetHeight + GAP + EDGE
    t.style.left = `${left}px`
    t.style.top = `${above ? r.top - t.offsetHeight - GAP : r.bottom + GAP}px`
    a.style.left = `${center - left - 4}px`
    Object.assign(a.style, above
      ? { top: '', bottom: '-5px', borderTop: '', borderLeft: '', borderRight: HAIRLINE, borderBottom: HAIRLINE }
      : { bottom: '', top: '-5px', borderRight: '', borderBottom: '', borderTop: HAIRLINE, borderLeft: HAIRLINE })
  }, [open])

  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    const onDown = (e: PointerEvent) => { if (!btn.current?.contains(e.target as Node)) close() }
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onDown)
    return () => {
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onDown)
    }
  }, [open])

  return (
    <>
      <button
        ref={btn}
        type="button"
        aria-label={`About ${term}`}
        aria-describedby={open ? id : undefined}
        onPointerDown={e => { lastPointer.current = e.pointerType }}
        onPointerEnter={e => { if (e.pointerType === 'mouse') setOpen(true) }}
        onPointerLeave={e => { if (e.pointerType === 'mouse') setOpen(false) }}
        // Keyboard focus only — a tap focuses too, and its click toggles
        onFocus={e => { if (e.currentTarget.matches(':focus-visible')) setOpen(true) }}
        onBlur={() => setOpen(false)}
        onClick={e => {
          e.stopPropagation()
          setOpen(o => lastPointer.current === 'mouse' || !o)
        }}
        // 8px of padding (offset by negative margins) makes a ~29px tap target around the 13px icon
        className="-my-2 mx-[-4px] inline-flex translate-y-[-1px] p-2 align-middle text-s-text3 transition-colors hover:text-gold-soft focus-visible:text-gold-soft"
      >
        <CircleHelp size={13} strokeWidth={2.25} aria-hidden />
      </button>
      {open && createPortal(
        <div
          ref={tip}
          id={id}
          role="tooltip"
          className="pointer-events-none fixed z-[600] max-w-[min(280px,calc(100vw-16px))] rounded-[4px] px-3 py-2 text-left text-[12px] font-normal normal-case leading-snug tracking-normal text-s-text2"
          style={{ left: -9999, top: -9999, background: '#16161B', border: HAIRLINE }}
        >
          <span className="font-bold text-s-text">{term}:</span> {children}
          <span ref={arrow} aria-hidden className="absolute h-2 w-2 rotate-45" style={{ background: '#16161B' }} />
        </div>,
        document.body,
      )}
    </>
  )
}
