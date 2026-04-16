'use client'

import { useState, useMemo } from 'react'
import { useLeague } from '@/context/LeagueContext'
import { MANUAL_CHAMPS, MANUAL_SHAME, EARNINGS_DATA, USER_ID_TO_OWNER } from '@/lib/constants'
import WinPctBadge from '@/components/shared/WinPctBadge'
import FinishBadge from '@/components/shared/FinishBadge'

type SortKey = 'name' | 'numSeasons' | 'allW' | 'allL' | 'winpct' | 'avgPF' | 'avgFinish' | 'bestFinish' | 'playoffApps' | 'champs' | 'shame' | 'earn'

export default function CareerLeaderboard() {
  const { state } = useLeague()
  const { ownerSeasons } = state
  const [sortKey, setSortKey] = useState<SortKey>('winpct')
  const [sortDir, setSortDir] = useState<1 | -1>(-1)
  const [playoffOnly, setPlayoffOnly] = useState(false)

  const canonicalNames = [...new Set(Object.values(USER_ID_TO_OWNER))]
  const names = canonicalNames.filter(n => ownerSeasons[n]).sort()

  function handleSort(k: SortKey) {
    if (sortKey === k) setSortDir(d => (d === 1 ? -1 : 1))
    else { setSortKey(k); setSortDir(-1) }
  }

  const data = useMemo(() => {
    return names.map(name => {
      const allSeasons = ownerSeasons[name] || []
      // seasons is what we compute stats from (respects the playoffs-only filter)
      const seasons = playoffOnly ? allSeasons.filter(s => s.inPlayoffs) : allSeasons
      const allW = seasons.reduce((a, s) => a + s.wins, 0)
      const allL = seasons.reduce((a, s) => a + s.losses, 0)
      const avgPF = seasons.length ? seasons.reduce((a, s) => a + s.pf, 0) / seasons.length : 0
      // playoffApps is always the career total, not filtered
      const playoffApps = allSeasons.filter(s => s.inPlayoffs).length
      const champs = MANUAL_CHAMPS.filter(c => c.winner?.includes(name))
        .reduce((sum, c) => sum + (c.half ? 0.5 : 1), 0)
      const shame = MANUAL_SHAME.filter(s => s.loser === name).length
      const earn = EARNINGS_DATA.find(e => e.owner === name)
      const finishes = seasons.filter(s => s.finish != null).map(s => s.finish as number)
      const avgFinish = finishes.length ? finishes.reduce((a, b) => a + b, 0) / finishes.length : null
      const bestFinish = finishes.length ? Math.min(...finishes) : null
      return {
        name, numSeasons: seasons.length, allW, allL,
        winpct: allW / (allW + allL || 1),
        avgPF, playoffApps, champs, shame,
        earn: earn ? earn.total : null,
        avgFinish, bestFinish,
      }
    })
  }, [names.join(','), ownerSeasons, playoffOnly])

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

  const SortTh = ({ k, label, hideOnMobile }: { k: SortKey; label: string; hideOnMobile?: boolean }) => (
    <th
      onClick={() => handleSort(k)}
      className={hideOnMobile ? 'hidden md:table-cell cursor-pointer' : 'cursor-pointer'}
      style={{ color: sortKey === k ? '#f59e0b' : undefined }}
    >
      {label}
    </th>
  )

  return (
    <div className="bg-s-bg2 border border-s-border rounded-[12px] p-[18px]">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="text-[10px] font-bold tracking-[2.5px] uppercase text-s-text3">Career Leaderboard</div>
        <button
          onClick={() => setPlayoffOnly(p => !p)}
          className={[
            'px-3 py-[5px] rounded-full border text-[11px] font-semibold cursor-pointer transition-all duration-150',
            playoffOnly
              ? 'bg-[#2d1a00] border-s-gold text-s-gold'
              : 'bg-s-bg3 border-s-border text-s-text3 hover:border-s-border2 hover:text-s-text2',
          ].join(' ')}
        >
          {playoffOnly ? '← All Games' : 'Playoffs Only'}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[700px]">
          <thead>
            <tr>
              <th>#</th>
              <SortTh k="name"        label="Manager" />
              <SortTh k="numSeasons"  label="Seasons"  hideOnMobile />
              <SortTh k="allW"        label="W" />
              <SortTh k="allL"        label="L" />
              <SortTh k="winpct"      label="Win%" />
              <SortTh k="avgPF"       label="Avg PF"   hideOnMobile />
              <SortTh k="avgFinish"   label="Avg Fin"  hideOnMobile />
              <SortTh k="bestFinish"  label="Best"     hideOnMobile />
              <SortTh k="playoffApps" label="Playoffs" hideOnMobile />
              <SortTh k="champs"      label="🏆" />
              <SortTh k="shame"       label="🚽" />
              <SortTh k="earn"        label="Net $" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((d, i) => {
              const rankColors = ['bg-[#3d2000] text-s-gold', 'bg-[#1a2030] text-[#b0c4de]', 'bg-[#1a1000] text-[#cd7f32]']
              const rankCls = i < 3 ? rankColors[i] : 'bg-s-bg4 text-s-text3'
              const pct = (d.winpct * 100).toFixed(1)
              return (
                <tr key={d.name} onClick={() => window.location.href = `/owners/${d.name}`}>
                  <td>
                    <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-[11px] font-extrabold ${rankCls}`}>{i + 1}</span>
                  </td>
                  <td className="font-bold text-s-text">{d.name}</td>
                  <td className="hidden md:table-cell text-s-text3">{d.numSeasons}</td>
                  <td className="text-s-green font-bold">{d.allW}</td>
                  <td className="text-s-red">{d.allL}</td>
                  <td><WinPctBadge pct={pct} /></td>
                  <td className="hidden md:table-cell text-s-blue">{d.avgPF.toFixed(0)}</td>
                  <td className="hidden md:table-cell text-s-text2">{d.avgFinish != null ? d.avgFinish.toFixed(1) : '—'}</td>
                  <td className="hidden md:table-cell"><FinishBadge finish={d.bestFinish} /></td>
                  <td className="hidden md:table-cell text-s-text2">{d.playoffApps}/{d.numSeasons}</td>
                  <td>{d.champs > 0 ? <span className="inline-flex items-center px-2 py-[2px] rounded-full text-[10px] font-bold bg-[#3d2000] text-s-gold border border-[#5a3200]">🏆 {d.champs}x</span> : <span className="text-s-text3">—</span>}</td>
                  <td>{d.shame > 0 ? <span className="inline-flex items-center px-2 py-[2px] rounded-full text-[10px] font-bold bg-[#3d0000] text-s-red border border-[#5a0000]">🚽 {d.shame}x</span> : <span className="text-s-text3">—</span>}</td>
                  <td className={d.earn != null ? (d.earn >= 0 ? 'text-s-green font-bold' : 'text-s-red font-bold') : 'text-s-text3'}>
                    {d.earn != null ? `${d.earn >= 0 ? '+' : ''}$${d.earn}` : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
