'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useLeague } from '@/context/LeagueContext'
import { scoringStrength } from '@/lib/stats'
import { INACTIVE_OWNERS } from '@/lib/league'
import InfoTip from '@/components/shared/InfoTip'

const GOLD = '#E8CE8A'
const signed = (n: number) => `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(1)}`

/**
 * Seasons → Scoring Trend: each owner's points per game above the league's
 * weekly average, with its 95% range. A dot and a line per owner, so it reads
 * the same on a phone as on a desktop.
 */
export default function ScoringStrengthChart() {
  const { state } = useLeague()
  const rows = useMemo(() => scoringStrength(state.allMatchups), [state.allMatchups])
  if (!rows.length) return null

  // One scale for every row, padded a little past the widest range, zero included
  const lo = Math.min(0, ...rows.map(r => r.low)), hi = Math.max(0, ...rows.map(r => r.high))
  const pad = (hi - lo) * 0.06
  const min = lo - pad, max = hi + pad
  const x = (v: number) => `${((v - min) / (max - min)) * 100}%`

  return (
    <div className="gl relative mb-4 overflow-hidden p-3 sm:p-[18px]">
      <div className="mb-1 text-[10px] font-bold uppercase tracking-[2.5px] text-gold-soft">
        Scoring Strength
        <InfoTip term="Scoring strength">
          points per game above that week’s league average, regular season, every season, so a high-scoring year flatters no one. The line is the 95% range for that average; more games, shorter line. Of every stat on this site, scoring is the one that carries from one season to the next.
        </InfoTip>
      </div>
      <div className="mb-3 text-[11px] text-s-text3">Points per game vs. the league that week · dot = average, line = 95% range</div>

      <div className="grid grid-cols-[64px_1fr_52px] items-center gap-x-2 sm:grid-cols-[96px_1fr_64px]">
        <span />
        <div className="relative h-4 text-[9px] font-bold uppercase tracking-[1px] text-s-text3">
          <span className="absolute -translate-x-1/2" style={{ left: x(0) }}>Avg</span>
        </div>
        <span className="text-right text-[9px] font-bold uppercase tracking-[1px] text-s-text3">Pts/G</span>

        {rows.map(r => (
          <div key={r.owner} className="contents" title={`${r.owner}: ${signed(r.avg)} per game (95% range ${signed(r.low)} to ${signed(r.high)}), ${r.games} games`}>
            <Link
              href={`/owners/${encodeURIComponent(r.owner)}`}
              className={`flex min-h-[32px] items-center break-words text-[12px] font-bold leading-tight hover:text-gold-soft ${INACTIVE_OWNERS.has(r.owner) ? 'text-s-text3' : 'text-s-text'}`}
            >
              {r.owner}
            </Link>
            <div className="relative h-[32px]" aria-hidden>
              <span className="absolute inset-y-1 w-px" style={{ left: x(0), background: 'rgba(var(--gold-rgb), 0.30)' }} />
              <span className="absolute top-1/2 h-[2px] -translate-y-1/2 rounded-full" style={{ left: x(r.low), right: `calc(100% - ${x(r.high)})`, background: '#5C6270' }} />
              <span className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ left: x(r.avg), background: GOLD, boxShadow: '0 0 0 2px #0B0B0D' }} />
            </div>
            <span className="text-right font-display text-[16px] font-semibold text-s-text2 num">
              {signed(r.avg)}
              <span className="sr-only"> per game, 95% range {signed(r.low)} to {signed(r.high)}, {r.games} games</span>
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 text-[10px] text-s-text3">Gray names are no longer in the league.</div>
    </div>
  )
}
