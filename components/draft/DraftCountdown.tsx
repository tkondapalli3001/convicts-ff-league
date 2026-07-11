'use client'

import { useEffect, useState } from 'react'
import { NEXT_DRAFT_DATE } from '@/lib/constants'

/** Whole days from the viewer's local midnight to draft-day midnight. */
function daysUntilDraft(now: Date): number {
  const draft = new Date(`${NEXT_DRAFT_DATE}T00:00:00`)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((draft.getTime() - today.getTime()) / 86_400_000)
}

/** Preseason countdown banner. Renders nothing once the draft date has passed. */
export default function DraftCountdown() {
  // Computed after mount so the prerendered HTML never disagrees with the client's clock
  const [days, setDays] = useState<number | null>(null)
  useEffect(() => { setDays(daysUntilDraft(new Date())) }, [])

  if (days === null || days < 0) return null

  const dateLine = new Date(`${NEXT_DRAFT_DATE}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })

  return (
    <div
      className="mb-5 flex items-center justify-between gap-4 rounded-[6px] px-4 py-3 sm:px-5"
      style={{ background: '#0B0B0D', border: '1px solid rgba(var(--gold-rgb), 0.16)' }}
    >
      <div>
        <div className="text-[10px] font-bold uppercase tracking-[2px] text-s-gold">Days til Draft</div>
        <div className="mt-0.5 text-[11px] text-s-text3">{dateLine}</div>
      </div>
      {days === 0 ? (
        <div className="font-display text-[28px] font-bold uppercase leading-none" style={{ color: '#E8CE8A' }}>
          Draft Day
        </div>
      ) : (
        <div className="font-display text-[44px] font-bold leading-none num" style={{ color: '#E8CE8A' }}>
          {days}
        </div>
      )}
    </div>
  )
}
