'use client'

import type { PlayerStat } from '@/types'

import { POS_BADGE_CLASSES as POS_COLORS } from '@/lib/constants'

interface Props {
  player: PlayerStat
  onClose: () => void
}

export default function PlayerCardModal({ player, onClose }: Props) {
  const pct = (player.winRate * 100).toFixed(1)
  const posClass = POS_COLORS[player.position] ?? 'bg-slate-500/20 text-slate-400 border-slate-500/30'

  // Sort owner counts descending
  const ownerList = Object.entries(player.ownerCounts)
    .sort((a, b) => b[1] - a[1])

  const winRateColor = player.winRate >= 0.6
    ? '#22c55e'
    : player.winRate >= 0.4
    ? '#94a3b8'
    : '#ef4444'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative w-full max-w-[480px] rounded-[18px] border border-white/[0.1] overflow-hidden"
        style={{ background: 'rgba(13, 17, 23, 0.97)' }}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-s-border flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${posClass}`}>
                {player.position}
              </span>
              {player.team && (
                <span className="text-[11px] text-s-text3">{player.team}</span>
              )}
            </div>
            <div className="text-[22px] font-extrabold text-s-text leading-tight">{player.name}</div>
          </div>
          <button
            onClick={onClose}
            className="text-s-text3 hover:text-s-text text-[20px] leading-none px-2 py-1 rounded-lg hover:bg-s-bg3 transition-colors flex-shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Career totals */}
        <div className="px-6 py-4 border-b border-s-border">
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center">
              <div className="text-[9px] uppercase tracking-[1.5px] text-s-text3 mb-1">Games</div>
              <div className="text-[24px] font-extrabold text-s-text">{player.games}</div>
            </div>
            <div className="text-center">
              <div className="text-[9px] uppercase tracking-[1.5px] text-s-text3 mb-1">Wins</div>
              <div className="text-[24px] font-extrabold text-s-green">{player.wins}</div>
            </div>
            <div className="text-center">
              <div className="text-[9px] uppercase tracking-[1.5px] text-s-text3 mb-1">Win%</div>
              <div className="text-[24px] font-extrabold" style={{ color: winRateColor }}>{pct}%</div>
            </div>
          </div>

          {/* Win rate bar */}
          <div className="h-2 rounded-full bg-s-bg3 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${(player.winRate * 100).toFixed(1)}%`,
                background: winRateColor,
              }}
            />
          </div>
        </div>

        {/* Season breakdown */}
        {player.yearStats.length > 0 && (
          <div className="px-6 py-4 border-b border-s-border">
            <div className="text-[10px] font-bold tracking-[2px] uppercase text-s-text3 mb-3">
              Season Breakdown
            </div>
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr>
                  <th className="text-left py-1 text-[9px] text-s-text3 font-semibold uppercase tracking-wider">Year</th>
                  <th className="text-center py-1 text-[9px] text-s-text3 font-semibold uppercase tracking-wider">G</th>
                  <th className="text-center py-1 text-[9px] text-s-text3 font-semibold uppercase tracking-wider">W</th>
                  <th className="text-right py-1 text-[9px] text-s-text3 font-semibold uppercase tracking-wider">Win%</th>
                </tr>
              </thead>
              <tbody>
                {[...player.yearStats].reverse().map(ys => {
                  const yr = ys.wins / ys.games
                  const yColor = yr >= 0.6 ? '#22c55e' : yr >= 0.4 ? '#94a3b8' : '#ef4444'
                  return (
                    <tr key={ys.year} className="border-t border-s-border/40">
                      <td className="py-1.5 font-bold text-s-text3">{ys.year}</td>
                      <td className="py-1.5 text-center text-s-text2">{ys.games}</td>
                      <td className="py-1.5 text-center text-s-green font-bold">{ys.wins}</td>
                      <td className="py-1.5 text-right font-bold" style={{ color: yColor }}>
                        {(yr * 100).toFixed(1)}%
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Owner breakdown */}
        {ownerList.length > 0 && (
          <div className="px-6 py-4">
            <div className="text-[10px] font-bold tracking-[2px] uppercase text-s-text3 mb-3">
              Started By
            </div>
            <div className="flex flex-wrap gap-2">
              {ownerList.map(([owner, count]) => (
                <div
                  key={owner}
                  className="flex items-center gap-1.5 bg-s-bg3 border border-s-border rounded-full px-3 py-1"
                >
                  <span className="text-[12px] font-semibold text-s-text">{owner}</span>
                  <span className="text-[10px] text-s-text3 font-bold">{count}×</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
