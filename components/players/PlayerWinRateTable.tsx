'use client'

import { useState, useMemo } from 'react'
import type { PlayerStat } from '@/types'

import { POS_TEXT_CLASSES as POS_COLORS } from '@/lib/constants'
import PlayerHeadshot from '@/components/shared/PlayerHeadshot'

const FLEX_POSITIONS = new Set(['QB', 'RB', 'WR', 'TE'])

type SortKey = 'name' | 'position' | 'games' | 'wins' | 'winRate' | 'topOwner'

interface Props {
  players: PlayerStat[]
  minGames?: number
  onPlayerClick: (player: PlayerStat) => void
}

export default function PlayerWinRateTable({ players, minGames = 10, onPlayerClick }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('winRate')
  const [sortDir, setSortDir] = useState<1 | -1>(-1)
  const [posFilter, setPosFilter] = useState<string>('ALL')

  function handleSort(k: SortKey) {
    if (sortKey === k) setSortDir(d => d === 1 ? -1 : 1)
    else { setSortKey(k); setSortDir(-1) }
  }

  const positions = useMemo(() => {
    const set = new Set(players.map(p => p.position).filter(Boolean))
    return ['ALL', 'QB', 'RB', 'WR', 'TE', 'FLEX', 'K', 'DEF'].filter(p =>
      p === 'ALL' || p === 'FLEX' || set.has(p)
    )
  }, [players])

  const filtered = useMemo(() => {
    return players
      .filter(p => {
        if (p.games < minGames) return false
        if (posFilter === 'ALL') return true
        if (posFilter === 'FLEX') return FLEX_POSITIONS.has(p.position)
        return p.position === posFilter
      })
      .sort((a, b) => {
        let av: string | number = a[sortKey]
        let bv: string | number = b[sortKey]
        if (typeof av === 'string') return av.localeCompare(bv as string) * sortDir
        return ((av as number) - (bv as number)) * sortDir
      })
  }, [players, posFilter, minGames, sortKey, sortDir])

  const SortTh = ({ k, label, right }: { k: SortKey; label: string; right?: boolean }) => (
    <th
      onClick={() => handleSort(k)}
      className={`cursor-pointer select-none ${right ? 'text-right' : 'text-left'}`}
      style={{ color: sortKey === k ? '#C9A24B' : undefined }}
    >
      {label} {sortKey === k ? (sortDir === 1 ? '↑' : '↓') : ''}
    </th>
  )

  return (
    <div className="bg-s-bg2 border border-s-border rounded-[12px] p-[18px]">
      <div className="text-[10px] font-bold tracking-[2.5px] uppercase text-s-text2 mb-3">
        Player Win Rate — min {minGames} games started
      </div>

      {/* Position filter */}
      <div className="flex gap-[6px] flex-wrap mb-4">
        {positions.map(pos => (
          <button
            key={pos}
            onClick={() => setPosFilter(pos)}
            className={[
              'px-3 py-[4px] rounded-full border text-[11px] font-semibold cursor-pointer transition-all duration-150',
              posFilter === pos
                ? 'border-gold text-gold-soft bg-[rgba(201,150,46,0.10)]'
                : 'bg-s-bg3 border-s-border text-s-text3 hover:border-s-border2 hover:text-s-text2',
            ].join(' ')}
          >
            {pos}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[12px] min-w-[480px]">
          <thead>
            <tr className="text-[10px] font-bold tracking-[1px] uppercase text-s-text3 border-b border-s-border">
              <SortTh k="name" label="Player" />
              <SortTh k="position" label="Pos" />
              <SortTh k="games" label="G" right />
              <SortTh k="wins" label="W" right />
              <SortTh k="winRate" label="Win%" right />
              <SortTh k="topOwner" label="Top Manager" />
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 25).map(p => {
              const posColor = POS_COLORS[p.position] ?? 'text-s-text3'
              const pct = (p.winRate * 100).toFixed(1)
              return (
                <tr
                  key={p.player_id}
                  className="border-b border-s-bg3 hover:bg-s-bg3 transition-colors cursor-pointer"
                  onClick={() => onPlayerClick(p)}
                >
                  <td className="py-[7px] pr-3 font-semibold text-s-text">
                    <div className="flex items-center gap-2">
                      <PlayerHeadshot playerId={p.player_id} position={p.position} size={22} />
                      <span>{p.name}</span>
                    </div>
                  </td>
                  <td className={`py-[7px] pr-3 font-bold text-[11px] ${posColor}`}>{p.position}</td>
                  <td className="py-[7px] pr-3 text-right text-s-text2">{p.games}</td>
                  <td className="py-[7px] pr-3 text-right text-s-green font-bold">{p.wins}</td>
                  <td className="py-[7px] pr-3 text-right">
                    <span className={`font-bold ${p.winRate >= 0.6 ? 'text-s-green' : p.winRate >= 0.4 ? 'text-s-text2' : 'text-s-red'}`}>
                      {pct}%
                    </span>
                  </td>
                  <td className="py-[7px] text-s-text3">{p.topOwner}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-8 text-s-text3 text-[12px]">No players match this filter</div>
        )}
      </div>
    </div>
  )
}
