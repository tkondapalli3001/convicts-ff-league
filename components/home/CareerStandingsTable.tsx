'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useLeague } from '@/context/LeagueContext'
import { ownerColor, fullNameInitials } from '@/lib/utils'
import type { CareerStats } from '@/lib/stats'

type SortKey = 'wins' | 'winpct' | 'avgPPG' | 'champs' | 'earn'

export default function CareerStandingsTable({ data }: { data: CareerStats[] }) {
  const { state } = useLeague()
  const router = useRouter()
  const [sortKey, setSortKey] = useState<SortKey>('winpct')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const displayData = useMemo(() => {
    return [...data].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      if (sortKey === 'wins') return dir * (a.allW - b.allW)
      if (sortKey === 'winpct') return dir * (a.winpct - b.winpct)
      if (sortKey === 'avgPPG') return dir * (a.avgPFperGame - b.avgPFperGame)
      if (sortKey === 'champs') return dir * (a.champs - b.champs)
      if (a.earn === null && b.earn === null) return 0
      if (a.earn === null) return 1
      if (b.earn === null) return -1
      return dir * (a.earn - b.earn)
    })
  }, [data, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }
  const icon = (key: SortKey) => sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''

  return (
    <div className="lg:col-span-2 bento-card" style={{ overflow: 'visible' }}>
      <div className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-s-border/60">
        <div className="text-[10px] font-bold tracking-[3px] uppercase text-s-text3">
          All-Time Career Standings
        </div>
        <div className="text-[9px] text-s-text3 font-medium hidden sm:block">
          Click a row to view profile
        </div>
      </div>

      <div className="relative">
        <div className="overflow-x-auto scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
        <table className="w-full border-collapse min-w-[560px] ss-table">
          <thead>
            <tr>
              <th className="w-10 text-center">#</th>
              <th className="sticky left-0 z-10 border-r border-white/[0.06]" style={{ background: '#0d121b' }}>Manager</th>
              <th onClick={() => toggleSort('wins')} className="cursor-pointer select-none hover:text-s-text2">W–L{icon('wins')}</th>
              <th onClick={() => toggleSort('winpct')} className="cursor-pointer select-none hover:text-s-text2">Win%{icon('winpct')}</th>
              <th onClick={() => toggleSort('avgPPG')} className="text-right cursor-pointer select-none hover:text-s-text2">Avg PPG{icon('avgPPG')}</th>
              <th onClick={() => toggleSort('champs')} className="text-center cursor-pointer select-none hover:text-s-text2">🏆{icon('champs')}</th>
              <th onClick={() => toggleSort('earn')} className="text-right cursor-pointer select-none hover:text-s-text2">Net ${icon('earn')}</th>
            </tr>
          </thead>
          <tbody>
            {displayData.map((d, i) => {
              const color = ownerColor(d.name)
              const avatarUrl = state.ownerAvatarMap?.[d.name]

              const rankColors = [
                'bg-[#3d2000]/80 text-s-gold border border-[#5a3000]/60',
                'bg-[#1c2430]/80 text-[#8b949e] border border-[#3d444d]/60',
                'bg-[#1a1200]/80 text-[#cd7f32] border border-[#3d2d00]/60',
              ]
              const rankCls = i < 3 ? rankColors[i] : 'bg-s-bg3/60 text-s-text3 border border-s-border/40'

              return (
                <tr
                  key={d.name}
                  onClick={() => router.push(`/owners/${encodeURIComponent(d.name)}`)}
                  className="hover:bg-indigo-500/10 transition-colors"
                >
                  <td className="text-center">
                    <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-[10px] font-extrabold ${rankCls}`}>
                      {i + 1}
                    </span>
                  </td>

                  <td className="sticky-owner sticky left-0 z-[1] border-r border-white/[0.06]">
                    <div className="flex items-center gap-3">
                      {/* Avatar: Sleeper image or gradient initials */}
                      {avatarUrl ? (
                        <div
                          className="w-9 h-9 rounded-full flex-shrink-0 overflow-hidden"
                          style={{ boxShadow: `0 0 0 2px #0e1117, 0 0 14px ${color}55` }}
                        >
                          <img src={avatarUrl} alt={d.name} className="w-full h-full object-cover"
                            onError={e => {
                              const el = e.currentTarget.parentElement!
                              el.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:900;color:#fff;background:linear-gradient(135deg,${color} 0%,${color}88 100%)">${fullNameInitials(d.name)}</div>`
                            }} />
                        </div>
                      ) : (
                        <div
                          className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-[12px] font-black text-white leading-none"
                          style={{
                            background: `linear-gradient(135deg, ${color} 0%, ${color}88 100%)`,
                            boxShadow: `0 0 0 2px #0e1117, 0 0 14px ${color}55`,
                          }}
                        >
                          {fullNameInitials(d.name)}
                        </div>
                      )}
                      <div>
                        <div className="text-[13px] font-bold text-s-text leading-none">{d.name}</div>
                        <div className="text-[10px] text-s-text3 mt-0.5">
                          {d.numSeasons} season{d.numSeasons !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span className="text-s-green font-bold text-[13px]">{d.allW}</span>
                    <span className="text-s-text3 mx-1 text-[11px]">–</span>
                    <span className="text-s-red text-[13px]">{d.allL}</span>
                  </td>

                  <td>
                    <span
                      className="text-[13px] font-bold"
                      style={{
                        color: d.winpct >= 0.55 ? '#00ceb8' : d.winpct >= 0.45 ? '#8b949e' : '#ff395c',
                      }}
                    >
                      {(d.winpct * 100).toFixed(1)}%
                    </span>
                  </td>

                  <td className="text-right">
                    <span className="text-[13px] font-bold text-s-text2 num">
                      {d.avgPFperGame.toFixed(1)}
                    </span>
                  </td>

                  <td className="text-center">
                    {d.champs > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#3d2000]/50 text-s-gold border border-[#5a3200]/50">
                        🏆 {d.champs % 1 === 0 ? d.champs : d.champs.toFixed(1)}×
                      </span>
                    ) : (
                      <span className="text-s-text3 text-[11px]">—</span>
                    )}
                  </td>

                  <td className="text-right">
                    {d.earn != null ? (
                      <span
                        className="text-[12px] font-bold"
                        style={{ color: d.earn >= 0 ? '#2ea043' : '#f85149' }}
                      >
                        {d.earn >= 0 ? '+' : ''}${d.earn}
                      </span>
                    ) : (
                      <span className="text-s-text3 text-[11px]">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-r from-transparent to-[rgba(11,14,17,0.85)] z-10" />
      </div>
    </div>
  )
}
