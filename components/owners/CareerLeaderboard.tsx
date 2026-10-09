'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useLeague } from '@/context/LeagueContext'
import { careerLeaderboard, type LeaderboardRow } from '@/lib/stats'
import WinPctBadge from '@/components/shared/WinPctBadge'
import OwnerAvatar from '@/components/shared/OwnerAvatar'
import SortHeader from '@/components/shared/SortHeader'

type SortKey = keyof LeaderboardRow

export default function CareerLeaderboard() {
  const { state } = useLeague()
  const { ownerSeasons, allMatchups, brackets, rosterUserMaps, leagues } = state
  const [sortKey, setSortKey] = useState<SortKey>('winpct')
  // 1 = ascending (↑), -1 = descending (↓), like every SortHeader table
  const [sortDir, setSortDir] = useState<1 | -1>(-1)
  const [playoffOnly, setPlayoffOnly] = useState(false)
  const router = useRouter()

  function handleSort(k: SortKey) {
    if (sortKey === k) setSortDir(d => (d === 1 ? -1 : 1))
    // Names start A–Z; numbers start biggest first
    else { setSortKey(k); setSortDir(k === 'name' ? 1 : -1) }
  }

  const data = useMemo(
    () => careerLeaderboard({ ownerSeasons, allMatchups, brackets, rosterUserMaps, leagues }, playoffOnly),
    [ownerSeasons, allMatchups, brackets, rosterUserMaps, leagues, playoffOnly],
  )

  const sorted = useMemo(() => {
    return [...data].sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (typeof av === 'string' && typeof bv === 'string') return av.localeCompare(bv) * sortDir
      // A missing value (no finish, no earnings line) sorts last either way
      if (av == null || bv == null) return av == null ? (bv == null ? 0 : 1) : -1
      return ((av as number) - (bv as number)) * sortDir
    })
  }, [data, sortKey, sortDir])

  const sort = { sortKey, sortDir, onSort: handleSort }

  return (
    <div className="gl p-[18px] relative overflow-hidden">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2 relative z-10">
        <div className="flex items-center gap-2.5">
          <span className="h-px w-5 bg-gold" />
          <div className="text-[11px] font-bold tracking-[4px] uppercase text-gold-soft">
            Career Leaderboard{playoffOnly ? ' — Playoff Only' : ''}
          </div>
        </div>
        <button
          onClick={() => setPlayoffOnly(p => !p)}
          className={[
            'rounded-[2px] border px-3 py-[5px] text-[10px] font-bold uppercase tracking-[1.5px] transition-colors duration-150',
            playoffOnly ? 'border-gold text-gold-soft' : 'text-s-text3 hover:text-gold-soft',
          ].join(' ')}
          style={playoffOnly ? undefined : { borderColor: 'rgba(var(--gold-rgb), 0.18)' }}
        >
          {playoffOnly ? '← All Games' : 'Playoffs Only'}
        </button>
      </div>

      <div className="relative">
        <div className="overflow-x-auto scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
          <table className="w-full border-collapse min-w-[700px] ss-table">
            <thead>
              <tr>
                <th className="w-8">#</th>
                <SortHeader {...sort} k="name" label="Manager"
                  className="sticky left-0 z-10 border-r border-white/[0.06]" style={{ background: '#0B0B0D' }} />
                <SortHeader {...sort} k="numSeasons"  label={playoffOnly ? 'Apps' : 'Seasons'} />
                <SortHeader {...sort} k="allW"        label="W" />
                <SortHeader {...sort} k="allL"        label="L" />
                <SortHeader {...sort} k="winpct"      label="Win%" />
                <SortHeader {...sort} k="avgPF"       label={playoffOnly ? 'Avg PF/Gm' : 'PF/Season'} />
                <SortHeader {...sort} k="avgFinish"   label="Avg Fin" />
                {!playoffOnly && <SortHeader {...sort} k="playoffApps" label="Playoffs" />}
                <SortHeader {...sort} k="champs"      label="🏆" />
                <SortHeader {...sort} k="shame"       label="🚽" />
                <SortHeader {...sort} k="earn"        label="Net $" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((d, i) => {
                const pct = (d.winpct * 100).toFixed(1)
                return (
                  <tr key={d.name} onClick={() => router.push(`/owners/${encodeURIComponent(d.name)}`)}>
                    <td className="text-center font-display text-[17px] font-bold" style={{ color: i < 3 ? '#C9A24B' : '#3A4150' }}>
                      {String(i + 1).padStart(2, '0')}
                    </td>
                    <td className="sticky-owner sticky left-0 z-[1] border-r border-white/[0.06] font-bold text-s-text">
                      <div className="flex items-center gap-2">
                        <OwnerAvatar name={d.name} size="sm" />
                        {d.name}
                      </div>
                    </td>
                  <td className="font-display text-[17px] font-semibold text-s-text2">{d.numSeasons}</td>
                  <td className="font-display text-[17px] font-bold" style={{ color: '#7FA886' }}>{d.allW}</td>
                  <td className="font-display text-[17px] font-bold" style={{ color: '#B4636B' }}>{d.allL}</td>
                  <td><WinPctBadge pct={pct} /></td>
                  <td className="font-display text-[17px] font-semibold text-s-text2 num">{d.avgPF.toFixed(1)}</td>
                  <td className="font-display text-[17px] font-semibold text-s-text2 num">{d.avgFinish != null ? d.avgFinish.toFixed(1) : '—'}</td>
                  {!playoffOnly && <td className="font-display text-[17px] font-semibold text-s-text2 num">{d.playoffApps}/{d.numSeasons}</td>}
                  <td className="text-center font-display text-[16px] font-bold">{d.champs > 0 ? <span className="text-gold-soft">{d.champs}×</span> : <span className="text-[#3A4150]">—</span>}</td>
                  <td className="text-center font-display text-[16px] font-bold">{d.shame > 0 ? <span className="text-loss">{d.shame}×</span> : <span className="text-[#3A4150]">—</span>}</td>
                  <td className="font-display text-[17px] font-bold num">
                    {d.earn != null ? (
                      <span style={{ color: d.earn >= 0 ? '#C9A24B' : '#B4636B' }}>{d.earn >= 0 ? '+' : '−'}${Math.abs(d.earn)}</span>
                    ) : (
                      <span className="text-[#3A4150]">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
            </tbody>
          </table>
        </div>
        {/* Right-edge gradient fade — signals scrollable content */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-r from-transparent to-[rgba(11,11,13,0.85)] z-10" />
      </div>
    </div>
  )
}
