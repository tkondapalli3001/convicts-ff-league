'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useLeague } from '@/context/LeagueContext'
import { ownerColor, fullNameInitials } from '@/lib/utils'
import { OWNER_FULL_NAMES } from '@/lib/constants'
import type { CareerStats } from '@/lib/stats'
import type { PlayerStat } from '@/types'

export default function ManagerCard({ data, playerWinRates = [], onClose }: { data: CareerStats; playerWinRates?: PlayerStat[]; onClose: () => void }) {
  const router = useRouter()
  const { state } = useLeague()
  const [imgError, setImgError] = useState(false)
  const color = ownerColor(data.name)
  const winpctColor = data.winpct >= 0.55 ? '#E8CE8A' : data.winpct >= 0.45 ? '#9AA0AC' : '#B4636B'
  const avatarUrl = state.ownerAvatarMap?.[data.name]
  const initials = fullNameInitials(data.name)
  const fullDisplayName = OWNER_FULL_NAMES[data.name] || data.name

  const mvpName = useMemo(() => {
    if (playerWinRates.length === 0) return null
    const playerById = new Map(playerWinRates.map(s => [s.player_id, s.name]))
    const totals: Record<string, number> = {}
    for (const [yearStr, weekMap] of Object.entries(state.matchups)) {
      const rMap = state.rosterUserMaps[Number(yearStr)] ?? {}
      for (const [, { matchups }] of Object.entries(weekMap)) {
        for (const entry of matchups) {
          if (rMap[String(entry.roster_id)] !== data.name) continue
          const starters = entry.starters ?? []
          const pts = entry.starters_points ?? []
          starters.forEach((pid, i) => {
            if (!pid || pid === '0') return
            totals[pid] = (totals[pid] ?? 0) + (pts[i] ?? 0)
          })
        }
      }
    }
    const sorted = Object.entries(totals).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1])
    const topId = sorted[0]?.[0]
    return topId ? (playerById.get(topId) ?? null) : null
  }, [state.matchups, state.rosterUserMaps, data.name, playerWinRates])

  return (
    <div className="bento-card animate-fade-in">
      {/* Header */}
      <div
        className="relative p-6 pb-5 overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${color}18 0%, transparent 60%)` }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-full bg-s-bg3/80 flex items-center justify-center text-s-text3 hover:text-s-text text-[16px] leading-none transition-colors"
        >
          ×
        </button>

        <div className="flex items-start gap-4">
          {/* Avatar */}
          {avatarUrl && !imgError ? (
            <div
              className="w-14 h-14 rounded-full flex-shrink-0 overflow-hidden"
              style={{ boxShadow: `0 0 0 3px #1a1d23, 0 0 24px ${color}55` }}
            >
              <img src={avatarUrl} alt={data.name} className="w-full h-full object-cover"
                onError={() => setImgError(true)} />
            </div>
          ) : (
            <div
              className="w-14 h-14 rounded-full flex-shrink-0 flex items-center justify-center text-[18px] font-black text-white"
              style={{
                background: `linear-gradient(135deg, ${color} 0%, ${color}88 100%)`,
                boxShadow: `0 0 0 3px #1a1d23, 0 0 24px ${color}55`,
              }}
            >
              {initials}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="text-[22px] font-black text-s-text tracking-tight leading-none">
                {fullDisplayName}
              </span>
              {data.champs > 0 && Array.from({ length: Math.ceil(data.champs) }, (_, i) => (
                <span key={i} className="text-base">🏆</span>
              ))}
              {data.shame > 0 && Array.from({ length: data.shame }, (_, i) => (
                <span key={i} className="text-base">🚽</span>
              ))}
            </div>
            <div className="text-[11px] text-s-text3 font-medium mt-1">
              {data.numSeasons} season{data.numSeasons !== 1 ? 's' : ''} &middot;{' '}
              {data.playoffApps}/{data.numSeasons} playoffs
            </div>
          </div>

          {/* Big win% */}
          <div className="hidden sm:block text-right flex-shrink-0">
            <div className="text-[9px] tracking-[3px] uppercase text-s-text3 mb-1">Win%</div>
            <div className="text-[38px] font-black leading-none tabular-nums" style={{ color: winpctColor }}>
              {(data.winpct * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Stats grid — 4 columns */}
      <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-s-border/60">
        {(
          [
            { label: 'W – L', value: `${data.allW} – ${data.allL}` },
            { label: 'Avg PPG', value: data.avgPFperGame > 0 ? data.avgPFperGame.toFixed(1) : '—' },
            {
              label: 'Championships',
              value: data.champs > 0 ? `${data.champs % 1 === 0 ? data.champs : data.champs.toFixed(1)}× 🏆` : '—',
            },
            {
              label: 'Net Earnings',
              value: data.earn != null ? `${data.earn >= 0 ? '+' : ''}$${data.earn}` : '—',
              color: data.earn != null ? (data.earn >= 0 ? '#2ea043' : '#f85149') : undefined,
            },
          ] as { label: string; value: string; color?: string }[]
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
            <div className="text-[17px] font-bold" style={{ color: s.color ?? '#EDE9E0' }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Best Season · Top Rival · MVP */}
      <div className="grid grid-cols-3 border-t border-s-border/60">
        <div className="px-4 py-3 border-r border-s-border/60">
          <div className="text-[9px] tracking-[2px] uppercase text-s-text3 mb-1.5">Best Season</div>
          {data.bestSeasonYear ? (
            <div className="flex flex-col gap-0.5">
              <span className="text-[15px] font-bold text-s-text">{data.bestSeasonYear}</span>
              <span className="text-[11px] font-semibold text-s-green">
                {data.bestSeasonWins}W–{data.bestSeasonLosses}L
              </span>
              {data.bestSeasonFinish != null && (
                <span className="text-[9px] self-start px-1.5 py-0.5 rounded-full bg-s-gold/10 text-s-gold border border-s-gold/20 font-bold">
                  #{data.bestSeasonFinish} Finish
                </span>
              )}
            </div>
          ) : <span className="text-s-text3 text-[12px]">—</span>}
        </div>

        <div className="px-4 py-3 border-r border-s-border/60">
          <div className="text-[9px] tracking-[2px] uppercase text-s-text3 mb-1">Top Rival</div>
          <div
            className="text-[13px] font-bold"
            style={{ color: data.topRival ? ownerColor(data.topRival) : '#6e7681' }}
          >
            {data.topRival ?? '—'}
          </div>
        </div>

        <div className="px-4 py-3">
          <div className="text-[9px] tracking-[2px] uppercase text-s-text3 mb-1">MVP</div>
          <div className="text-[13px] font-bold text-s-text leading-snug">
            {mvpName ?? '—'}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-5 pb-5 pt-3">
        <button
          onClick={() => router.push(`/owners/${encodeURIComponent(data.name)}`)}
          className="text-[11px] font-bold text-gold hover:opacity-70 transition-opacity flex items-center gap-1"
        >
          View Full Profile →
        </button>
      </div>
    </div>
  )
}
