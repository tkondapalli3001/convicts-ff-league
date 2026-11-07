'use client'

import Link from 'next/link'
import OwnerAvatar from '@/components/shared/OwnerAvatar'
import { fmtPts } from '@/lib/utils'
import { formatOdds } from '@/lib/current-season'
import type { YourMatchup } from '@/hooks/usePreviewData'

const STATUS = { final: 'Final', live: 'Live', upcoming: 'Up next' } as const

/** Your game this week, first thing: score, opponent, playoff odds. Opens the full matchup. */
export default function YourMatchupCard({ m, href, onOpen, className }: {
  m: YourMatchup
  /** A link to the matchup (from another page), or a handler (already on the season tab). */
  href?: string
  onOpen?: () => void
  className?: string
}) {
  const { week, status, you, opp, ptsYou, ptsOpp, projYou, projOpp, stakes } = m
  const played = status !== 'upcoming'
  const leading = played && ptsYou !== ptsOpp ? ptsYou > ptsOpp : null
  const score = (n: number, projected: number | null) => (played ? fmtPts(n) : projected != null ? projected.toFixed(1) : '—')
  const note = [
    played && projYou != null && projOpp != null ? `Proj ${projYou.toFixed(1)}–${projOpp.toFixed(1)}` : !played ? 'Projected' : null,
    stakes ? `Playoff odds ${formatOdds(stakes.odds, stakes.status)}` : null,
  ].filter(Boolean).join(' · ')

  const body = (
    <>
      <div className="flex items-center gap-2.5">
        <span className="h-px w-5 flex-shrink-0 bg-gold" />
        <span className="text-[10px] font-bold uppercase tracking-[2.5px] text-gold-soft">Your matchup</span>
        <span className="ml-auto text-[9px] font-bold uppercase tracking-[1.5px] text-s-text3">
          Week {week} · <span className={status === 'live' ? 'text-win' : undefined}>{STATUS[status]}</span>
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <OwnerAvatar name={you} size="sm-md" />
          <span className="truncate font-display text-[17px] font-bold uppercase text-s-text">{you}</span>
        </div>
        <span className="flex-shrink-0 font-display text-[24px] font-bold leading-none num" style={{ color: leading === true ? '#7FA886' : '#EDE9E0' }}>{score(ptsYou, projYou)}</span>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <OwnerAvatar name={opp} size="sm-md" />
          <span className="truncate font-display text-[17px] font-bold uppercase text-s-text2">{opp}</span>
        </div>
        <span className="flex-shrink-0 font-display text-[24px] font-bold leading-none num" style={{ color: leading === false ? '#7FA886' : '#9AA0AC' }}>{score(ptsOpp, projOpp)}</span>
      </div>
      {note && <div className="mt-3 text-[10px] font-semibold uppercase tracking-[1px] text-s-text3">{note}</div>}
    </>
  )

  const shell = `block w-full rounded-[6px] p-4 text-left transition-colors hover:bg-[rgba(var(--gold2-rgb),0.04)] ${className ?? ''}`
  const style = { background: '#0B0B0D', border: '1px solid rgba(var(--gold-rgb), 0.28)' }
  return href
    ? <Link href={href} className={shell} style={style}>{body}</Link>
    : <button type="button" onClick={onOpen} className={shell} style={style}>{body}</button>
}
