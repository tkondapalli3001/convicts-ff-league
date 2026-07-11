'use client'

import { useState, useMemo } from 'react'
import { useLeague } from '@/context/LeagueContext'

import { POS_BADGE_CLASSES as POS_COLORS } from '@/lib/constants'

interface PickResult {
  year: number
  playerName: string
  position: string
  owner: string
  pickNo: number
  totalPts: number
  pickRank: number
  ptsRank: number
  value: number
}

export default function StealsBusts() {
  const { state } = useLeague()
  const { draftData, matchups, rosterUserMaps, years } = state
  const [selectedYear, setSelectedYear] = useState<number | null>(null)

  const allResults = useMemo<PickResult[]>(() => {
    const results: PickResult[] = []

    for (const year of years) {
      const draft = draftData[year]
      if (!draft?.picks?.length) continue
      const rMap = rosterUserMaps[year] ?? {}
      const weekData = matchups[year]
      if (!weekData) continue

      const playerPts: Record<string, number> = {}
      for (const { matchups: weekMatchups } of Object.values(weekData)) {
        for (const m of weekMatchups) {
          if (!m.players_points) continue
          for (const [pid, pts] of Object.entries(m.players_points)) {
            playerPts[pid] = (playerPts[pid] ?? 0) + pts
          }
        }
      }

      const pickedPlayers = draft.picks.filter(pick => !pick.is_keeper).map(pick => {
        const pts = playerPts[pick.player_id] ?? 0
        const owner = rMap[String(pick.roster_id)] ?? `Slot ${pick.draft_slot}`
        const playerName = [pick.metadata.first_name, pick.metadata.last_name].filter(Boolean).join(' ')
          || pick.player_id
        return {
          year,
          playerName,
          position: pick.metadata.position ?? '?',
          owner,
          pickNo: pick.pick_no,
          totalPts: pts,
        }
      }).filter(p => p.totalPts > 0 && p.position !== '?')

      const positions = [...new Set(pickedPlayers.map(p => p.position))]
      for (const pos of positions) {
        const group = pickedPlayers
          .filter(p => p.position === pos)
          .sort((a, b) => a.pickNo - b.pickNo)
        const byPts = [...group].sort((a, b) => b.totalPts - a.totalPts)
        group.forEach((p, pickIdx) => {
          const ptsIdx = byPts.findIndex(x => x.playerName === p.playerName && x.pickNo === p.pickNo)
          results.push({
            ...p,
            pickRank: pickIdx + 1,
            ptsRank: ptsIdx + 1,
            value: (pickIdx + 1) - (ptsIdx + 1),
          })
        })
      }
    }
    return results
  }, [draftData, matchups, rosterUserMaps, years])

  const filtered = selectedYear !== null
    ? allResults.filter(r => r.year === selectedYear)
    : allResults

  const steals = [...filtered].sort((a, b) => b.value - a.value).slice(0, 10)
  const busts  = [...filtered].sort((a, b) => a.value - b.value).slice(0, 10)

  if (!steals.length && !busts.length) {
    return (
      <div className="gl p-6 text-center text-s-text3 text-[12px]">
        Not enough draft + scoring data to compute steals and busts yet.
      </div>
    )
  }

  const sortedYears = [...years].sort((a, b) => a - b)

  return (
    <div className="space-y-4">
      {/* Year filter */}
      <div className="flex gap-[6px] flex-wrap items-center">
        <button
          onClick={() => setSelectedYear(null)}
          className={[
            'px-3 py-[4px] rounded-full border text-[11px] font-semibold cursor-pointer transition-all duration-150',
            selectedYear === null
              ? 'border-gold text-gold-soft bg-[rgba(201,150,46,0.10)]'
              : 'bg-s-bg3 border-s-border text-s-text3 hover:border-s-border2 hover:text-s-text2',
          ].join(' ')}
        >
          All Years
        </button>
        {sortedYears.map(y => (
          <button
            key={y}
            onClick={() => setSelectedYear(y === selectedYear ? null : y)}
            className={[
              'px-3 py-[4px] rounded-full border text-[11px] font-semibold cursor-pointer transition-all duration-150',
              selectedYear === y
                ? 'border-gold text-gold-soft bg-[rgba(201,150,46,0.10)]'
                : 'bg-s-bg3 border-s-border text-s-text3 hover:border-s-border2 hover:text-s-text2',
            ].join(' ')}
          >
            {y}
          </button>
        ))}
      </div>

      <p className="text-[11px] text-s-text3">
        Steals picked later than their positional peers but outscored them. Busts were drafted early but underperformed.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PickList title="Top Steals" emoji="💎" picks={steals} isSteal />
        <PickList title="Top Busts" emoji="💀" picks={busts} isSteal={false} />
      </div>
    </div>
  )
}

function PickList({ title, emoji, picks, isSteal }: {
  title: string
  emoji: string
  picks: PickResult[]
  isSteal: boolean
}) {
  const [sortKey, setSortKey] = useState<'playerName' | 'owner' | 'pickNo' | 'totalPts' | 'value'>('value')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(isSteal ? 'desc' : 'asc')

  function toggleSort(key: typeof sortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }
  const icon = (key: typeof sortKey) => sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''

  const sortedPicks = [...picks].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1
    if (sortKey === 'playerName') return dir * a.playerName.localeCompare(b.playerName)
    if (sortKey === 'owner') return dir * a.owner.localeCompare(b.owner)
    if (sortKey === 'pickNo') return dir * (a.pickNo - b.pickNo)
    if (sortKey === 'totalPts') return dir * (a.totalPts - b.totalPts)
    return dir * (a.value - b.value)
  })

  return (
    <div className="gl">
      <div className="px-4 py-3 border-b border-s-border flex items-center gap-2">
        <span className="text-[16px]">{emoji}</span>
        <span className="text-[12px] font-extrabold tracking-[1.5px] uppercase text-s-text">{title}</span>
      </div>
      {/* Scroll wrapper — overflow-hidden on parent clips gradient to card bounds */}
      <div className="relative">
        <div className="overflow-x-auto scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
          <table className="w-full border-collapse min-w-[420px]">
            <thead>
              <tr>
                <th className="text-left px-4 py-2 text-[9px] font-bold tracking-[2px] uppercase text-s-text3 border-b border-s-border">#</th>
                <th onClick={() => toggleSort('playerName')} className="text-left px-3 py-2 text-[9px] font-bold tracking-[2px] uppercase text-s-text3 border-b border-s-border cursor-pointer select-none hover:text-s-text2">Player{icon('playerName')}</th>
                <th onClick={() => toggleSort('owner')} className="text-left px-3 py-2 text-[9px] font-bold tracking-[2px] uppercase text-s-text3 border-b border-s-border cursor-pointer select-none hover:text-s-text2">Manager{icon('owner')}</th>
                <th onClick={() => toggleSort('pickNo')} className="text-center px-3 py-2 text-[9px] font-bold tracking-[2px] uppercase text-s-text3 border-b border-s-border cursor-pointer select-none hover:text-s-text2">Pick{icon('pickNo')}</th>
                <th onClick={() => toggleSort('totalPts')} className="text-center px-3 py-2 text-[9px] font-bold tracking-[2px] uppercase text-s-text3 border-b border-s-border cursor-pointer select-none hover:text-s-text2">Pts{icon('totalPts')}</th>
                <th onClick={() => toggleSort('value')} className="text-center px-3 py-2 text-[9px] font-bold tracking-[2px] uppercase text-s-text3 border-b border-s-border cursor-pointer select-none hover:text-s-text2">Value{icon('value')}</th>
              </tr>
            </thead>
            <tbody>
              {sortedPicks.map((p, i) => {
                const posClass = POS_COLORS[p.position] ?? 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                return (
                  <tr key={`${p.year}-${p.playerName}-${p.pickNo}`} className="border-b border-s-border/40 hover:bg-s-bg3/30 transition-colors">
                    <td className="px-4 py-2 text-[11px] font-bold text-s-text3">{i + 1}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-bold px-1 py-0 rounded border ${posClass}`}>{p.position}</span>
                        <div>
                          <div className="text-[12px] font-semibold text-s-text leading-tight">{p.playerName}</div>
                          <div className="text-[9px] text-s-text3">{p.year}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-[11px] text-s-text2">{p.owner}</td>
                    <td className="px-3 py-2 text-center text-[11px] text-s-text3">
                      <span className="font-mono">#{p.pickNo}</span>
                      <span className="text-[9px] ml-1 text-s-text3">({p.pickRank} at pos)</span>
                    </td>
                    <td className="px-3 py-2 text-center text-[11px] font-mono text-s-text2">
                      {p.totalPts.toFixed(1)}
                    </td>
                    <td className={`px-3 py-2 text-center text-[12px] font-extrabold ${isSteal ? 'text-s-green' : 'text-s-red'}`}>
                      {isSteal ? `+${p.value}` : p.value}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {/* Right-edge gradient fade — clipped by parent overflow-hidden to card bounds */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-r from-transparent to-[rgba(8,12,20,0.85)] z-10" />
      </div>
    </div>
  )
}
