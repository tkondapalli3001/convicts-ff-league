'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useLeague } from '@/context/LeagueContext'
import { careerLeaderboard, type LeaderboardRow } from '@/lib/stats'
import WinPctBadge from '@/components/shared/WinPctBadge'
import OwnerAvatar from '@/components/shared/OwnerAvatar'

type SortKey = keyof LeaderboardRow

/** Header cell: gold while it's the sort column. Module-level so it isn't remounted on every render. */
function LeaderboardTh({ k, label, sortKey, onSort, stickyFirst }: {
  k: SortKey
  label: string
  sortKey: SortKey
  onSort: (k: SortKey) => void
  stickyFirst?: boolean
}) {
  return (
    <th
      onClick={() => onSort(k)}
      className={stickyFirst ? 'cursor-pointer sticky left-0 z-10 border-r border-white/[0.06]' : 'cursor-pointer'}
      style={{
        color: sortKey === k ? '#C9A24B' : undefined,
        background: stickyFirst ? '#0B0B0D' : undefined,
      }}
    >
      {label}
    </th>
  )
}

export default function CareerLeaderboard() {
  const { state } = useLeague()
  const { ownerSeasons, allMatchups, brackets, rosterUserMaps, leagues } = state
  const [sortKey, setSortKey] = useState<SortKey>('winpct')
  const [sortDir, setSortDir] = useState<1 | -1>(1)
  const [playoffOnly, setPlayoffOnly] = useState(false)
  const router = useRouter()

  function handleSort(k: SortKey) {
    if (sortKey === k) setSortDir(d => (d === 1 ? -1 : 1))
    else { setSortKey(k); setSortDir(1) }
  }

  const data = useMemo(
    () => careerLeaderboard({ ownerSeasons, allMatchups, brackets, rosterUserMaps, leagues }, playoffOnly),
    [ownerSeasons, allMatchups, brackets, rosterUserMaps, leagues, playoffOnly],
  )

  const sorted = useMemo(() => {
    return [...data].sort((a, b) => {
      let av = a[sortKey] as number | null
      let bv = b[sortKey] as number | null
      const fallback = sortDir < 0 ? -Infinity : Infinity
      av = av ?? fallback
      bv = bv ?? fallback
      return (bv - av) * sortDir
    })
  }, [data, sortKey, sortDir])

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
                <LeaderboardTh sortKey={sortKey} onSort={handleSort} k="name"        label="Manager" stickyFirst />
                <LeaderboardTh sortKey={sortKey} onSort={handleSort} k="numSeasons"  label={playoffOnly ? 'Apps' : 'Seasons'} />
                <LeaderboardTh sortKey={sortKey} onSort={handleSort} k="allW"        label="W" />
                <LeaderboardTh sortKey={sortKey} onSort={handleSort} k="allL"        label="L" />
                <LeaderboardTh sortKey={sortKey} onSort={handleSort} k="winpct"      label="Win%" />
                <LeaderboardTh sortKey={sortKey} onSort={handleSort} k="avgPF"       label={playoffOnly ? 'Avg PF/Gm' : 'PF/Season'} />
                <LeaderboardTh sortKey={sortKey} onSort={handleSort} k="avgFinish"   label="Avg Fin" />
                {!playoffOnly && <LeaderboardTh sortKey={sortKey} onSort={handleSort} k="playoffApps" label="Playoffs" />}
                <LeaderboardTh sortKey={sortKey} onSort={handleSort} k="champs"      label="🏆" />
                <LeaderboardTh sortKey={sortKey} onSort={handleSort} k="shame"       label="🚽" />
                <LeaderboardTh sortKey={sortKey} onSort={handleSort} k="earn"        label="Net $" />
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
