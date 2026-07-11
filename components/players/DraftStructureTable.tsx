'use client'

import { useState } from 'react'
import type { DraftStructureEntry } from '@/lib/data-processing'

const STRATEGY_DESCRIPTIONS: Record<string, string> = {
  'Zero-RB':  'No RBs in rounds 1–5. Loads up on WRs and TEs early, grabs RBs on the waiver wire.',
  'Hero-RB':  'First-round pick is a RB. Bet on one elite workhorse, fill the rest with receivers.',
  'RB-Heavy': '3+ RBs in rounds 1–5. Running back by committee — quantity over quality at the position.',
  'Balanced': '2 RBs and 2 WRs in rounds 1–5. Mix of skills, no strong positional commitment.',
}

const STRATEGY_COLORS: Record<string, string> = {
  'Zero-RB':  'text-[#60a5fa]',
  'Hero-RB':  'text-[#7FA886]',
  'RB-Heavy': 'text-[#f97316]',
  'Balanced': 'text-[#9AA0AC]',
}

function ordinal(n: number) {
  if (n === 1) return 'st'
  if (n === 2) return 'nd'
  if (n === 3) return 'rd'
  return 'th'
}

interface Props {
  data: DraftStructureEntry[]
}

export default function DraftStructureTable({ data }: Props) {
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null)
  const [stratSort, setStratSort] = useState<'strategy' | 'avgWins' | 'avgFinish'>('avgFinish')
  const [stratDir, setStratDir] = useState<'asc' | 'desc'>('asc')

  function toggleStratSort(key: typeof stratSort) {
    if (stratSort === key) setStratDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setStratSort(key); setStratDir('asc') }
  }
  const stratIcon = (key: typeof stratSort) => stratSort === key ? (stratDir === 'asc' ? ' ↑' : ' ↓') : ''

  const sortedData = [...data].sort((a, b) => {
    const dir = stratDir === 'asc' ? 1 : -1
    if (stratSort === 'strategy') return dir * a.strategy.localeCompare(b.strategy)
    if (stratSort === 'avgWins') return dir * (a.avgWins - b.avgWins)
    return dir * (a.avgFinish - b.avgFinish)
  })

  if (!data.length) {
    return (
      <div className="bg-s-bg2 border border-s-border rounded-[12px] p-[18px]">
        <div className="text-center py-8 text-s-text3 text-[12px]">No draft structure data available</div>
      </div>
    )
  }

  const best = data.reduce((prev, cur) => cur.avgFinish < prev.avgFinish ? cur : prev, data[0])
  const selectedEntry = data.find(e => e.strategy === selectedStrategy) ?? null

  return (
    <div className="bg-s-bg2 border border-s-border rounded-[12px] p-[18px]">
      <div className="text-[10px] font-bold tracking-[2.5px] uppercase text-s-text2 mb-1">
        Draft Strategy vs Season Outcome
      </div>
      <div className="text-[11px] text-s-text3 mb-4">
        Based on rounds 1–5 position selection across all seasons · Click a strategy to see instances
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {data.map(entry => {
          const color = STRATEGY_COLORS[entry.strategy] ?? 'text-s-text2'
          const isBest = entry.strategy === best.strategy
          const isSelected = entry.strategy === selectedStrategy
          return (
            <div
              key={entry.strategy}
              onClick={() => setSelectedStrategy(isSelected ? null : entry.strategy)}
              className={`rounded-[10px] p-4 border cursor-pointer transition-all duration-150 ${
                isSelected
                  ? 'border-gold bg-[rgba(201,150,46,0.10)] ring-1 ring-[rgba(201,150,46,0.4)]'
                  : isBest
                  ? 'border-s-gold bg-[#1a1200] hover:border-s-gold/70'
                  : 'border-s-border bg-s-bg3 hover:border-s-border2'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className={`text-[14px] font-extrabold ${color}`}>{entry.strategy}</span>
                  {isBest && !isSelected && (
                    <span className="ml-2 text-[9px] font-bold uppercase tracking-[1px] text-s-gold bg-[rgba(201,150,46,0.10)] px-[6px] py-[2px] rounded-full border border-[rgba(230,190,90,0.25)]">
                      Best Avg Finish
                    </span>
                  )}
                  {isSelected && (
                    <span className="ml-2 text-[9px] font-bold uppercase tracking-[1px] text-gold-soft bg-[rgba(201,150,46,0.12)] px-[6px] py-[2px] rounded-full border border-[rgba(230,190,90,0.4)]">
                      Selected
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-s-text3">{entry.count} seasons</span>
              </div>
              <div className="text-[10px] text-s-text3 mb-3">{STRATEGY_DESCRIPTIONS[entry.strategy]}</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[9px] uppercase tracking-[1px] text-s-text3 mb-[2px]">Avg Wins</div>
                  <div className="text-[20px] font-extrabold text-s-text leading-none">{entry.avgWins.toFixed(1)}</div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-[1px] text-s-text3 mb-[2px]">Avg Finish</div>
                  <div className={`text-[20px] font-extrabold leading-none ${isBest ? 'text-s-gold' : 'text-s-text'}`}>
                    #{entry.avgFinish.toFixed(1)}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Instance detail panel */}
      {selectedEntry && (
        <div className="mb-4 rounded-[10px] border border-[rgba(230,190,90,0.3)] bg-[#0B0B0D] p-4">
          <div className="text-[10px] font-bold tracking-[2px] uppercase text-gold-soft mb-3">
            {selectedEntry.strategy} · {selectedEntry.examples.length} instance{selectedEntry.examples.length !== 1 ? 's' : ''}
          </div>
          {/* Scroll wrapper ensures the "Made Playoffs" column is reachable on narrow screens */}
          <div className="relative">
            <div className="overflow-x-auto scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
          <table className="w-full border-collapse text-[12px] min-w-[300px]">
            <thead>
              <tr>
                <th className="text-left py-1.5 pr-4 text-[9px] text-s-text3 font-semibold uppercase tracking-wider">Year</th>
                <th className="text-left py-1.5 pr-4 text-[9px] text-s-text3 font-semibold uppercase tracking-wider">Manager</th>
                <th className="text-center py-1.5 pr-4 text-[9px] text-s-text3 font-semibold uppercase tracking-wider">Finish</th>
                <th className="text-center py-1.5 text-[9px] text-s-text3 font-semibold uppercase tracking-wider">Made Playoffs</th>
              </tr>
            </thead>
            <tbody>
              {[...selectedEntry.examples]
                .sort((a, b) => b.year - a.year || (a.finish ?? 99) - (b.finish ?? 99))
                .map((ex, i) => (
                  <tr key={`${ex.year}-${ex.owner}-${i}`} className="border-t border-s-border/30">
                    <td className="py-1.5 pr-4 text-s-text3 font-bold">{ex.year}</td>
                    <td className="py-1.5 pr-4 font-semibold text-s-text">{ex.owner}</td>
                    <td className="py-1.5 pr-4 text-center font-bold text-s-text2">
                      {ex.finish === null ? '—'
                        : ex.finish === 1 ? '🏆 1st'
                        : `${ex.finish}${ordinal(ex.finish)}`}
                    </td>
                    <td className="py-1.5 text-center">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        ex.madePlayoffs
                          ? 'bg-[rgba(127,168,134,0.14)] text-win'
                          : 'bg-[rgba(180,99,107,0.14)] text-loss'
                      }`}>
                        {ex.madePlayoffs ? 'Yes' : 'No'}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
            </div>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-r from-transparent to-[rgba(8,14,26,0.85)] z-10" />
          </div>
        </div>
      )}

      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr className="text-[10px] font-bold tracking-[1px] uppercase text-s-text3 border-b border-s-border">
            <th onClick={() => toggleStratSort('strategy')} className="text-left py-[5px] pr-3 cursor-pointer select-none hover:text-s-text2">Strategy{stratIcon('strategy')}</th>
            <th onClick={() => toggleStratSort('avgWins')} className="text-right py-[5px] pr-3 cursor-pointer select-none hover:text-s-text2">Avg W{stratIcon('avgWins')}</th>
            <th onClick={() => toggleStratSort('avgFinish')} className="text-right py-[5px] cursor-pointer select-none hover:text-s-text2">Avg Finish{stratIcon('avgFinish')}</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map(entry => {
            const color = STRATEGY_COLORS[entry.strategy] ?? 'text-s-text2'
            return (
              <tr key={entry.strategy} className="border-b border-s-bg3">
                <td className={`py-[7px] pr-3 font-bold ${color}`}>{entry.strategy}</td>
                <td className="py-[7px] pr-3 text-right font-bold text-s-text">{entry.avgWins.toFixed(1)}</td>
                <td className="py-[7px] text-right font-bold text-s-text">#{entry.avgFinish.toFixed(1)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
