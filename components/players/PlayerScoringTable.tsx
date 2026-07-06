'use client'

import { useState, useMemo } from 'react'
import type { PlayerScoreStat } from '@/lib/data-processing'

import { POS_TEXT_CLASSES as POS_COLORS } from '@/lib/constants'

const FLEX_POSITIONS = new Set(['QB', 'RB', 'WR', 'TE'])

type SortKey = 'rank' | 'name' | 'position' | 'totalPoints' | 'games' | 'avgPPG'

interface Props {
  playerScores: PlayerScoreStat[]
  years: number[]
  ownerNames: string[]
}

interface Row {
  player_id: string
  name: string
  position: string
  team: string
  totalPoints: number
  games: number
  avgPPG: number
}

export default function PlayerScoringTable({ playerScores, years, ownerNames }: Props) {
  const [yearFilter, setYearFilter] = useState<number | 'all'>('all')
  const [ownerFilter, setOwnerFilter] = useState<string | 'all'>('all')
  const [posFilter, setPosFilter] = useState<string>('ALL')
  const [sortKey, setSortKey] = useState<SortKey>('totalPoints')
  const [sortDir, setSortDir] = useState<1 | -1>(-1)

  const sortedYears = useMemo(() => [...years].sort((a, b) => b - a), [years])

  function handleSort(k: SortKey) {
    if (sortKey === k) setSortDir(d => (d === 1 ? -1 : 1))
    else { setSortKey(k); setSortDir(-1) }
  }

  const rows = useMemo<Row[]>(() => {
    return playerScores
      .filter(p => {
        if (posFilter === 'ALL') return true
        if (posFilter === 'FLEX') return FLEX_POSITIONS.has(p.position)
        return p.position === posFilter
      })
      .map(p => {
        let totalPoints = 0
        let games = 0
        for (const [owner, yearMap] of Object.entries(p.byOwnerYear)) {
          if (ownerFilter !== 'all' && owner !== ownerFilter) continue
          for (const [yr, { pts, games: g }] of Object.entries(yearMap)) {
            if (yearFilter !== 'all' && Number(yr) !== yearFilter) continue
            totalPoints += pts
            games += g
          }
        }
        return {
          player_id: p.player_id,
          name: p.name,
          position: p.position,
          team: p.team,
          totalPoints,
          games,
          avgPPG: games > 0 ? totalPoints / games : 0,
        }
      })
      .filter(r => r.games > 0 && r.totalPoints > 0)
      .sort((a, b) => {
        const av = a[sortKey === 'rank' ? 'totalPoints' : sortKey]
        const bv = b[sortKey === 'rank' ? 'totalPoints' : sortKey]
        if (typeof av === 'string') return (av as string).localeCompare(bv as string) * sortDir
        return ((av as number) - (bv as number)) * sortDir
      })
      .slice(0, 25)
  }, [playerScores, yearFilter, ownerFilter, posFilter, sortKey, sortDir])

  const positions = useMemo(() => {
    const set = new Set(playerScores.map(p => p.position).filter(Boolean))
    return ['ALL', 'QB', 'RB', 'WR', 'TE', 'FLEX', 'K', 'DEF'].filter(p =>
      p === 'ALL' || p === 'FLEX' || set.has(p)
    )
  }, [playerScores])

  const SortTh = ({ k, label, right }: { k: SortKey; label: string; right?: boolean }) => (
    <th
      onClick={() => handleSort(k)}
      className={`cursor-pointer select-none ${right ? 'text-right' : 'text-left'}`}
      style={{ color: sortKey === k ? '#f59e0b' : undefined }}
    >
      {label} {sortKey === k ? (sortDir === 1 ? '↑' : '↓') : ''}
    </th>
  )

  return (
    <div className="bg-s-bg2 border border-s-border rounded-[12px] p-[18px]">
      <div className="text-[10px] font-bold tracking-[2.5px] uppercase text-s-text2 mb-3">
        Top Scorers — Top 25 by total points scored in starts
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap gap-3 mb-4 items-start">
        {/* Season filter */}
        <div>
          <div className="text-[9px] tracking-[2px] uppercase text-s-text3 mb-1.5">Season</div>
          <div className="flex gap-[5px] flex-wrap">
            <button
              onClick={() => setYearFilter('all')}
              className={[
                'px-3 py-[4px] rounded-full border text-[11px] font-semibold cursor-pointer transition-all duration-150',
                yearFilter === 'all'
                  ? 'bg-[#1a2e4a] border-s-blue text-[#93c5fd]'
                  : 'bg-s-bg3 border-s-border text-s-text3 hover:border-s-border2 hover:text-s-text2',
              ].join(' ')}
            >
              All
            </button>
            {sortedYears.map(y => (
              <button
                key={y}
                onClick={() => setYearFilter(y)}
                className={[
                  'px-3 py-[4px] rounded-full border text-[11px] font-semibold cursor-pointer transition-all duration-150',
                  yearFilter === y
                    ? 'bg-[#1a2e4a] border-s-blue text-[#93c5fd]'
                    : 'bg-s-bg3 border-s-border text-s-text3 hover:border-s-border2 hover:text-s-text2',
                ].join(' ')}
              >
                {y}
              </button>
            ))}
          </div>
        </div>

        {/* Owner filter */}
        <div>
          <div className="text-[9px] tracking-[2px] uppercase text-s-text3 mb-1.5">Owner</div>
          <div className="flex gap-[5px] flex-wrap">
            <button
              onClick={() => setOwnerFilter('all')}
              className={[
                'px-3 py-[4px] rounded-full border text-[11px] font-semibold cursor-pointer transition-all duration-150',
                ownerFilter === 'all'
                  ? 'bg-[#2a1a4a] border-[#a78bfa] text-[#a78bfa]'
                  : 'bg-s-bg3 border-s-border text-s-text3 hover:border-s-border2 hover:text-s-text2',
              ].join(' ')}
            >
              All
            </button>
            {ownerNames.map(name => (
              <button
                key={name}
                onClick={() => setOwnerFilter(name)}
                className={[
                  'px-3 py-[4px] rounded-full border text-[11px] font-semibold cursor-pointer transition-all duration-150',
                  ownerFilter === name
                    ? 'bg-[#2a1a4a] border-[#a78bfa] text-[#a78bfa]'
                    : 'bg-s-bg3 border-s-border text-s-text3 hover:border-s-border2 hover:text-s-text2',
                ].join(' ')}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
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
                ? 'bg-[#3d2000]/60 border-s-gold/60 text-s-gold'
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
              <th className="text-left w-8">#</th>
              <SortTh k="name" label="Player" />
              <SortTh k="position" label="Pos" />
              <SortTh k="totalPoints" label="Total Pts" right />
              <SortTh k="games" label="G" right />
              <SortTh k="avgPPG" label="Avg PPG" right />
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const posColor = POS_COLORS[r.position] ?? 'text-s-text3'
              return (
                <tr
                  key={r.player_id}
                  className="border-b border-s-bg3 hover:bg-s-bg3 transition-colors"
                >
                  <td className="py-[7px] pr-2 text-s-text3 text-[11px]">{i + 1}</td>
                  <td className="py-[7px] pr-3 font-semibold text-s-text">{r.name}</td>
                  <td className={`py-[7px] pr-3 font-bold text-[11px] ${posColor}`}>{r.position}</td>
                  <td className="py-[7px] pr-3 text-right font-bold text-s-gold tabular-nums">
                    {r.totalPoints.toFixed(2)}
                  </td>
                  <td className="py-[7px] pr-3 text-right text-s-text2 tabular-nums">{r.games}</td>
                  <td className="py-[7px] text-right text-s-text2 tabular-nums">
                    {r.avgPPG.toFixed(2)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="text-center py-8 text-s-text3 text-[12px]">No scoring data for this filter</div>
        )}
      </div>
    </div>
  )
}
