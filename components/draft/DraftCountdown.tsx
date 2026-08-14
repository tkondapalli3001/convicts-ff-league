'use client'

import { useEffect, useState } from 'react'
import { NEXT_DRAFT_AT, NEXT_DRAFT_LABEL } from '@/lib/constants'

const KICKOFF_MS = new Date(NEXT_DRAFT_AT).getTime()
/** Keep the banner up (as "on the clock") for the length of a draft. */
const LIVE_WINDOW_MS = 6 * 3_600_000

interface Remaining { days: number; hours: number; mins: number; secs: number }

function remainingFrom(nowMs: number): Remaining {
  const total = Math.max(0, Math.floor((KICKOFF_MS - nowMs) / 1000))
  return {
    days:  Math.floor(total / 86_400),
    hours: Math.floor(total / 3_600) % 24,
    mins:  Math.floor(total / 60) % 60,
    secs:  total % 60,
  }
}

const pad = (n: number) => String(n).padStart(2, '0')

function Segment({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span
        className="font-display num text-[34px] font-bold leading-none tabular-nums sm:text-[44px]"
        style={{ color: '#E8CE8A' }}
      >
        {value}
      </span>
      <span className="mt-1 text-[9px] font-bold uppercase tracking-[2px] text-s-text3">
        {label}
      </span>
    </div>
  )
}

function Colon() {
  return (
    <span
      className="font-display text-[26px] font-bold leading-none sm:text-[34px]"
      style={{ color: 'rgba(var(--gold-rgb), 0.45)' }}
    >
      :
    </span>
  )
}

/** Live countdown to draft kickoff. Renders nothing once the draft window closes. */
export default function DraftCountdown() {
  // Computed after mount so the prerendered HTML never disagrees with the client's clock
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  if (now === null || now > KICKOFF_MS + LIVE_WINDOW_MS) return null

  const live = now >= KICKOFF_MS
  const { days, hours, mins, secs } = remainingFrom(now)

  return (
    <div
      className="mb-5 flex flex-col gap-3 rounded-[6px] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5"
      style={{ background: '#0B0B0D', border: '1px solid rgba(var(--gold-rgb), 0.16)' }}
    >
      <div>
        <div className="font-display text-[20px] font-bold uppercase leading-none tracking-[3px] text-s-gold sm:text-[24px]">
          {live ? 'On the Clock' : 'Til Draft'}
        </div>
        <div className="mt-1.5 text-[10px] font-bold uppercase tracking-[2px] text-s-text3">
          {NEXT_DRAFT_LABEL}
        </div>
      </div>

      {live ? (
        <div
          className="font-display text-[30px] font-bold uppercase leading-none tracking-[2px] animate-gold-pulse sm:text-[38px]"
          style={{ color: '#E8CE8A' }}
        >
          Draft Is Live
        </div>
      ) : (
        <div
          className="flex items-start gap-2.5 sm:gap-3"
          role="timer"
          aria-live="off"
          aria-label={`${days} days ${hours} hours ${mins} minutes until the draft`}
        >
          {days > 0 && (
            <>
              <Segment value={String(days)} label={days === 1 ? 'Day' : 'Days'} />
              <div className="pt-1.5 sm:pt-2"><Colon /></div>
            </>
          )}
          <Segment value={pad(hours)} label="Hrs" />
          <div className="pt-1.5 sm:pt-2"><Colon /></div>
          <Segment value={pad(mins)} label="Min" />
          <div className="pt-1.5 sm:pt-2"><Colon /></div>
          <Segment value={pad(secs)} label="Sec" />
        </div>
      )}
    </div>
  )
}
