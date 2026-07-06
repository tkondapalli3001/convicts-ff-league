'use client'

import { useState, useMemo } from 'react'
import type { EnrichedTransaction } from '@/hooks/useTransactionsData'
import type { PlayerStat } from '@/types'

import { POS_TEXT_CLASSES as POS_COLORS } from '@/lib/constants'
import PlayerHeadshot from '@/components/shared/PlayerHeadshot'

interface Props {
  transactions: EnrichedTransaction[]
  playerWinRates: PlayerStat[]
}

export default function MostTradedPlayersTable({ transactions, playerWinRates }: Props) {
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all')

  const tradeYears = useMemo(() => {
    const years = new Set<number>()
    for (const tx of transactions) {
      if (tx.type === 'trade') years.add(tx.year)
    }
    return [...years].sort((a, b) => b - a)
  }, [transactions])

  const winRateMap = useMemo(() => {
    const map = new Map<string, PlayerStat>()
    playerWinRates.forEach(p => map.set(p.player_id, p))
    return map
  }, [playerWinRates])

  const topTraded = useMemo(() => {
    const counts = new Map<string, { name: string; count: number }>()
    for (const tx of transactions) {
      if (tx.type !== 'trade') continue
      if (selectedYear !== 'all' && tx.year !== selectedYear) continue
      for (const p of tx.addedPlayers) {
        const existing = counts.get(p.playerId)
        if (existing) existing.count++
        else counts.set(p.playerId, { name: p.name, count: 1 })
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([playerId, { name, count }]) => {
        const stat = winRateMap.get(playerId)
        return { playerId, name, count, position: stat?.position ?? '—', winRate: stat?.winRate ?? null }
      })
  }, [transactions, winRateMap, selectedYear])

  if (topTraded.length === 0) return null

  return (
    <div className="bg-s-bg2 border border-s-border rounded-[12px] p-[18px] mb-3">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="text-[10px] font-bold tracking-[2.5px] uppercase text-s-text2">
          Most Traded Players
        </div>
        <select
          value={selectedYear}
          onChange={e => setSelectedYear(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="bg-s-bg3 border border-s-border text-s-text2 text-[11px] font-semibold rounded-[6px] px-2 py-1 cursor-pointer outline-none hover:border-s-border2 transition-colors"
        >
          <option value="all">All Time</option>
          {tradeYears.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[12px] min-w-[380px]">
          <thead>
            <tr className="text-[10px] font-bold tracking-[1px] uppercase text-s-text3 border-b border-s-border">
              <th className="text-center w-8">#</th>
              <th className="text-left">Player</th>
              <th className="text-left">Pos</th>
              <th className="text-right">Times Traded</th>
              <th className="text-right">Win Rate</th>
            </tr>
          </thead>
          <tbody>
            {topTraded.map((row, i) => {
              const posColor = POS_COLORS[row.position] ?? 'text-s-text3'
              const winRateColor =
                row.winRate === null ? '#6e7681'
                : row.winRate >= 0.60 ? '#22c55e'
                : row.winRate >= 0.40 ? '#8b949e'
                : '#f85149'
              return (
                <tr key={row.playerId} className="border-b border-s-bg3 hover:bg-s-bg3 transition-colors">
                  <td className="py-[7px] text-center text-s-text3 font-bold">{i + 1}</td>
                  <td className="py-[7px] pr-3 font-semibold text-s-text">
                    <div className="flex items-center gap-2">
                      <PlayerHeadshot playerId={row.playerId} position={row.position} size={22} />
                      <span>{row.name}</span>
                    </div>
                  </td>
                  <td className={`py-[7px] pr-3 font-bold text-[11px] ${posColor}`}>{row.position}</td>
                  <td className="py-[7px] pr-3 text-right font-bold text-s-text">{row.count}</td>
                  <td className="py-[7px] text-right font-bold" style={{ color: winRateColor }}>
                    {row.winRate !== null ? `${(row.winRate * 100).toFixed(1)}%` : '—'}
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
