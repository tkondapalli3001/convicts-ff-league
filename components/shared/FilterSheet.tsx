'use client'

import { useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import BottomSheet from '@/components/shared/BottomSheet'

/**
 * Long filter lists, phone-sized: one Filters button that says what's on, and
 * the chips in a bottom sheet. Wider screens show the chips inline in
 * `className`'s panel, as before.
 */
export default function FilterSheet({ summary, result, className = '', children }: {
  /** What's filtered, in a few words: "2025 · All owners". */
  summary: string
  /** The sheet's close button says what it shows: "Show 84 matchups". */
  result?: string
  className?: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className={`hidden sm:block ${className}`}>{children}</div>

      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="mb-4 flex min-h-[44px] w-full items-center gap-2 rounded-[6px] border px-3 py-2 text-left sm:hidden"
        style={{ background: '#0B0B0D', borderColor: 'rgba(var(--gold-rgb), 0.18)' }}
      >
        <SlidersHorizontal size={14} className="flex-shrink-0 text-gold-soft" aria-hidden />
        <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-[2px] text-gold-soft">Filters</span>
        <span className="min-w-0 flex-1 text-right text-[12px] leading-snug text-s-text2">{summary}</span>
      </button>

      {open && (
        <BottomSheet title="Filters" onClose={() => setOpen(false)}>
          <div className="p-4">{children}</div>
          <div className="px-4 pb-4">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="min-h-[44px] w-full rounded-[2px] border border-gold text-[11px] font-bold uppercase tracking-[2px] text-gold-soft"
              style={{ background: 'rgba(var(--gold2-rgb), 0.08)' }}
            >
              {result ?? 'Done'}
            </button>
          </div>
        </BottomSheet>
      )}
    </>
  )
}
