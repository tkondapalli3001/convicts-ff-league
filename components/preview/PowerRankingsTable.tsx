'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import SectionCard from '@/components/shared/SectionCard'
import OwnerAvatar from '@/components/shared/OwnerAvatar'
import { ordinal } from '@/lib/preview'
import type { PowerRankingRow } from '@/lib/stats'

function Movement({ n }: { n: number | null }) {
  if (n == null) return <span className="w-6" />
  if (n === 0) return <span className="w-6 text-[10px] font-bold text-s-muted">—</span>
  const up = n > 0
  return (
    <span
      className="w-6 text-[10px] font-bold"
      style={{ color: up ? '#7FA886' : '#B4636B' }}
      aria-label={`${up ? 'up' : 'down'} ${Math.abs(n)}`}
    >
      {up ? '▲' : '▼'}{Math.abs(n)}
    </span>
  )
}

// Rank order is the point of this table — headers aren't sort controls
const TH = 'cursor-default hover:text-s-text3'

function record(w: number, l: number, t: number): string {
  return t ? `${w}–${l}–${t}` : `${w}–${l}`
}

/** Power Rankings tab: Oberon Mt. power ratings with week-over-week movement. */
export default function PowerRankingsTable({ rows, throughWeek }: { rows: PowerRankingRow[]; throughWeek: number }) {
  const router = useRouter()

  if (!rows.length) {
    return (
      <div
        className="rounded-[6px] px-4 py-8 text-center text-[13px] text-s-text3"
        style={{ background: '#0B0B0D', border: '1px solid rgba(var(--gold-rgb), 0.12)' }}
      >
        Power rankings start once Week 1 is final.
      </div>
    )
  }

  const num = 'font-display text-[17px] font-semibold num'

  return (
    <SectionCard title="Power Rankings" action={<span className="text-[10px] font-bold uppercase tracking-[2px] text-s-text3">Through Week {throughWeek}</span>}>
      <div className="relative">
        <div className="ss-table overflow-x-auto scrollbar-hide">
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr>
                <th className={`sticky left-0 z-10 border-r border-white/[0.06] ${TH}`} style={{ background: '#0B0B0D' }}>Rank · Manager</th>
                <th className={TH}>Power</th>
                <th className={TH}>Record</th>
                <th className={TH}>Standing</th>
                <th className={TH}>PF/Gm</th>
                <th className={TH}>High</th>
                <th className={TH}>Low</th>
                <th className={TH}>All-Play</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.name} onClick={() => router.push(`/owners/${encodeURIComponent(r.name)}`)}>
                  <td className="sticky-owner sticky left-0 z-[1] border-r border-white/[0.06]">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-6 text-right font-display text-[20px] font-bold leading-none"
                        style={{ color: r.rank === 1 ? '#E8CE8A' : '#9AA0AC' }}
                      >
                        {r.rank}
                      </span>
                      <Movement n={r.movement} />
                      <Link
                        href={`/owners/${encodeURIComponent(r.name)}`}
                        onClick={e => e.stopPropagation()}
                        className="flex items-center gap-2 font-bold text-s-text transition-colors hover:text-gold-soft"
                      >
                        <OwnerAvatar name={r.name} size="sm" />
                        {r.name}
                      </Link>
                    </div>
                  </td>
                  <td className="font-display text-[20px] font-bold num" style={{ color: '#E8CE8A' }}>
                    {r.score.toFixed(1)}
                  </td>
                  <td className="font-display text-[17px] font-bold text-s-text">{record(r.wins, r.losses, r.ties)}</td>
                  <td className="text-[12px] font-semibold text-s-text2">{ordinal(r.standing)}</td>
                  <td className={`${num} text-s-text2`}>{r.avg.toFixed(1)}</td>
                  <td className={num} style={{ color: '#7FA886' }}>{r.high.toFixed(1)}</td>
                  <td className={num} style={{ color: '#B4636B' }}>{r.low.toFixed(1)}</td>
                  <td className={`${num} text-s-text2`}>{record(r.allPlayWins, r.allPlayLosses, r.allPlayTies)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Right-edge fade — signals more columns on narrow screens */}
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-r from-transparent to-[rgba(11,14,17,0.85)] sm:hidden" />
      </div>

      <p className="border-t px-5 py-3.5 text-[10px] leading-relaxed text-s-text3" style={{ borderColor: 'rgba(var(--gold-rgb), 0.10)' }}>
        <span className="font-bold text-s-text2">Power</span> = ((Avg × 6) + ((High + Low) × 2) + ((Win% × 200) × 2)) ÷ 10
        — the Oberon Mt. formula: 60% scoring average, 20% ceiling + floor, 20% winning.
        {' '}<span className="font-bold text-s-text2">▲▼</span> places moved since last week.
        {' '}<span className="font-bold text-s-text2">All-Play</span> = record if you played all {rows.length - 1} teams every week.
        {' '}Standing is Sleeper&apos;s order (wins, then points). Final scores only.
      </p>
    </SectionCard>
  )
}
