'use client'

import { useMemo } from 'react'
import { POS_COLORS } from '@/lib/constants'
import type { OwnershipEntry } from '@/lib/data-processing'
import type { PlayerStat } from '@/types'

export default function PlayerCard({
  stat,
  ownership,
  onClose,
}: {
  stat: PlayerStat
  ownership: OwnershipEntry | null
  onClose: () => void
}) {
  const posColor = POS_COLORS[stat.position] ?? '#6e7681'
  const winRateColor = stat.winRate >= 0.60 ? '#00ceb8' : stat.winRate >= 0.45 ? '#8b949e' : '#ff395c'

  const byOwner = useMemo(() => {
    if (!ownership) return null
    return ownership.picks.reduce<Record<string, number>>((acc, p) => {
      acc[p.owner] = (acc[p.owner] ?? 0) + 1
      return acc
    }, {})
  }, [ownership])

  const ownerList = byOwner
    ? Object.entries(byOwner)
        .sort((a, b) => b[1] - a[1])
        .map(([o, c]) => (c > 1 ? `${o} (${c}×)` : o))
        .join(' · ')
    : null

  return (
    <div className="bento-card animate-fade-in">
      {/* Header */}
      <div
        className="relative p-6 pb-5 overflow-hidden"
        style={{ background: `${posColor}14` }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-full bg-s-bg3/80 flex items-center justify-center text-s-text3 hover:text-s-text text-[16px] leading-none transition-colors"
        >
          ×
        </button>

        <div className="flex items-start gap-3">
          {/* Position badge */}
          <div
            className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center text-[13px] font-black"
            style={{
              background: `${posColor}22`,
              color: posColor,
              border: `1px solid ${posColor}50`,
            }}
          >
            {stat.position}
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-[20px] font-black text-s-text tracking-tight leading-tight">
              {stat.name}
            </div>
            {stat.team && (
              <div className="text-[11px] text-s-text3 mt-0.5">{stat.team}</div>
            )}
          </div>

          <div className="hidden sm:block text-right flex-shrink-0">
            <div className="text-[9px] tracking-[3px] uppercase text-s-text3 mb-1">Win Rate</div>
            <div className="text-[34px] font-black leading-none tabular-nums" style={{ color: winRateColor }}>
              {(stat.winRate * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-s-border/60">
        {(
          [
            { label: 'Games Started', value: stat.games },
            { label: 'Wins', value: stat.wins },
            { label: 'Most Started By', value: stat.topOwner || '—' },
            {
              label: 'Avg Draft Pick',
              value: ownership ? `#${ownership.avgPickNo.toFixed(1)}` : '—',
            },
          ] as { label: string; value: string | number }[]
        ).map((s, i) => (
          <div
            key={s.label}
            className={[
              'p-4',
              i > 0 ? 'border-l border-s-border/60' : '',
              i >= 2 ? 'border-t border-s-border/60' : '',
            ].join(' ')}
          >
            <div className="text-[9px] tracking-[2px] uppercase text-s-text3 mb-1">{s.label}</div>
            <div className="text-[17px] font-bold text-s-text">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Draft history */}
      {ownerList && (
        <div className="px-5 py-4 border-t border-s-border/60">
          <div className="text-[9px] tracking-[2px] uppercase text-s-text3 mb-1.5">
            Draft History &mdash; {ownership!.picks.length}× drafted
          </div>
          <div className="text-[12px] text-s-text2 leading-relaxed">{ownerList}</div>
        </div>
      )}

      {!ownership && (
        <div className="px-5 pb-4 text-[10px] text-s-text3">
          Draft history loads from the Players page.
        </div>
      )}
    </div>
  )
}
