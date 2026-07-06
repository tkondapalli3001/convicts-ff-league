'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useLeague } from '@/context/LeagueContext'
import { EARNINGS_DATA } from '@/lib/constants'
import { activeOwnerNames, championshipCount, shameCount, buildChampPathGameKeys, gameKey } from '@/lib/stats'
import WinPctBadge from '@/components/shared/WinPctBadge'
import OwnerAvatar from '@/components/shared/OwnerAvatar'

type SortKey = 'name' | 'numSeasons' | 'allW' | 'allL' | 'winpct' | 'avgPF' | 'avgFinish' | 'playoffApps' | 'champs' | 'shame' | 'earn'

export default function CareerLeaderboard() {
  const { state } = useLeague()
  const { ownerSeasons, allMatchups, brackets, rosterUserMaps, leagues } = state
  const [sortKey, setSortKey] = useState<SortKey>('winpct')
  const [sortDir, setSortDir] = useState<1 | -1>(1)
  const [playoffOnly, setPlayoffOnly] = useState(false)
  const router = useRouter()

  // Championship-path game keys only (excludes 3rd/5th place games + losers bracket)
  const winnersBracketGameKeys = useMemo(
    () => buildChampPathGameKeys({ brackets, rosterUserMaps, leagues }),
    [brackets, rosterUserMaps, leagues]
  )

  const names = activeOwnerNames(ownerSeasons).sort()

  function handleSort(k: SortKey) {
    if (sortKey === k) setSortDir(d => (d === 1 ? -1 : 1))
    else { setSortKey(k); setSortDir(1) }
  }

  const data = useMemo(() => {
    return names.map(name => {
      const allSeasons = ownerSeasons[name] || []
      const playoffApps = allSeasons.filter(s => s.inPlayoffs).length
      const champs = championshipCount(name)
      const shame = shameCount(name)
      const earn = EARNINGS_DATA.find(e => e.owner === name)

      let allW: number, allL: number, avgPF: number, numSeasons: number, avgFinish: number | null

      if (playoffOnly) {
        // Use actual playoff game records from allMatchups
        const playoffGames = allMatchups.filter(
          g => g.type === 'P' &&
               (g.team1 === name || g.team2 === name) &&
               winnersBracketGameKeys.has(gameKey(g.year, g.week, g.team1, g.team2))
        )
        allW = playoffGames.filter(g => g.winner === name).length
        allL = playoffGames.filter(g => g.loser === name).length
        avgPF = playoffGames.length
          ? playoffGames.reduce((sum, g) => sum + (g.team1 === name ? g.pts1 : g.pts2), 0) / playoffGames.length
          : 0
        numSeasons = playoffApps
        const playoffFinishes = allSeasons.filter(s => s.inPlayoffs && s.finish != null).map(s => s.finish as number)
        avgFinish = playoffFinishes.length ? playoffFinishes.reduce((a, b) => a + b, 0) / playoffFinishes.length : null
      } else {
        allW = allSeasons.reduce((a, s) => a + s.wins, 0)
        allL = allSeasons.reduce((a, s) => a + s.losses, 0)
        avgPF = allSeasons.length ? allSeasons.reduce((a, s) => a + s.pf, 0) / allSeasons.length : 0
        numSeasons = allSeasons.length
        const finishes = allSeasons.filter(s => s.finish != null).map(s => s.finish as number)
        avgFinish = finishes.length ? finishes.reduce((a, b) => a + b, 0) / finishes.length : null
      }

      return {
        name, numSeasons, allW, allL,
        winpct: allW / (allW + allL || 1),
        avgPF, playoffApps, champs, shame,
        earn: earn ? earn.total : null,
        avgFinish,
      }
    })
  }, [names.join(','), ownerSeasons, allMatchups, winnersBracketGameKeys, playoffOnly])

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

  const SortTh = ({ k, label, hideOnMobile, stickyFirst }: { k: SortKey; label: string; hideOnMobile?: boolean; stickyFirst?: boolean }) => (
    <th
      onClick={() => handleSort(k)}
      className={[
        hideOnMobile ? 'hidden md:table-cell cursor-pointer' : 'cursor-pointer',
        stickyFirst ? 'sticky left-0 z-10 border-r border-white/[0.06]' : '',
      ].filter(Boolean).join(' ')}
      style={{
        color: sortKey === k ? '#f59e0b' : undefined,
        background: stickyFirst ? '#0d121b' : undefined,
      }}
    >
      {label}
    </th>
  )

  return (
    <div className="gl p-[18px] relative overflow-hidden">
      <div className="bento-fill" style={{ background: 'rgba(59,130,246,0.15)' }} />
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2 relative z-10">
        <div className="text-[10px] font-bold tracking-[2.5px] uppercase text-slate-400">
          Career Leaderboard{playoffOnly ? ' — Playoff Games Only' : ''}
        </div>
        <button
          onClick={() => setPlayoffOnly(p => !p)}
          className={[
            'px-3 py-[5px] rounded-full border text-[11px] font-semibold cursor-pointer transition-all duration-150',
            playoffOnly
              ? 'bg-[#2d1a00] border-s-gold text-s-gold'
              : 'bg-white/5 border-white/10 text-slate-400 hover:text-white bento-interactive',
          ].join(' ')}
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
                <SortTh k="name"        label="Manager" stickyFirst />
                <SortTh k="numSeasons"  label={playoffOnly ? 'Apps' : 'Seasons'} />
                <SortTh k="allW"        label="W" />
                <SortTh k="allL"        label="L" />
                <SortTh k="winpct"      label="Win%" />
                <SortTh k="avgPF"       label={playoffOnly ? 'Avg PF/Gm' : 'Avg PF'} />
                <SortTh k="avgFinish"   label="Avg Fin" />
                {!playoffOnly && <SortTh k="playoffApps" label="Playoffs" />}
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
                  <tr key={d.name} onClick={() => router.push(`/owners/${encodeURIComponent(d.name)}`)} className="hover:bg-indigo-500/10 transition-colors">
                    <td>
                      <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-[11px] font-extrabold num ${rankCls}`}>{i + 1}</span>
                    </td>
                    <td className="sticky-owner sticky left-0 z-[1] border-r border-white/[0.06] font-bold text-s-text">
                      <div className="flex items-center gap-2">
                        <OwnerAvatar name={d.name} size="sm" />
                        {d.name}
                      </div>
                    </td>
                  <td className="text-s-text3 num">{d.numSeasons}</td>
                  <td className="text-s-green font-bold num">{d.allW}</td>
                  <td className="text-s-red num">{d.allL}</td>
                  <td><WinPctBadge pct={pct} /></td>
                  <td className="text-s-text2 num">{d.avgPF.toFixed(1)}</td>
                  <td className="text-s-text2 num">{d.avgFinish != null ? d.avgFinish.toFixed(1) : '—'}</td>
                  {!playoffOnly && <td className="text-s-text2 num">{d.playoffApps}/{d.numSeasons}</td>}
                  <td>{d.champs > 0 ? <span className="inline-flex items-center px-2 py-[2px] rounded-full text-[10px] font-bold bg-[#3d2000] text-s-gold border border-[#5a3200]">🏆 {d.champs}x</span> : <span className="text-s-text3">—</span>}</td>
                  <td>{d.shame > 0 ? <span className="inline-flex items-center px-2 py-[2px] rounded-full text-[10px] font-bold bg-[#3d0000] text-s-red border border-[#5a0000]">🚽 {d.shame}x</span> : <span className="text-s-text3">—</span>}</td>
                  <td className={`num ${d.earn != null ? (d.earn >= 0 ? 'text-s-green font-bold' : 'text-s-red font-bold') : 'text-s-text3'}`}>
                    {d.earn != null ? `${d.earn >= 0 ? '+' : ''}$${d.earn}` : '—'}
                  </td>
                </tr>
              )
            })}
            </tbody>
          </table>
        </div>
        {/* Right-edge gradient fade — signals scrollable content */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-r from-transparent to-[rgba(11,14,17,0.85)] z-10" />
      </div>
    </div>
  )
}
