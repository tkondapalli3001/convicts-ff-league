'use client'

import type { DraftStructureEntry } from '@/lib/data-processing'

const STRATEGY_DESCRIPTIONS: Record<string, string> = {
  'Zero-RB':  'No RBs in rounds 1–3. Prioritizes WR/TE early.',
  'Hero-RB':  'RB taken with first-round pick. Build around one elite RB.',
  'WR-Heavy': '2+ WRs in rounds 1–3. Volume receiver approach.',
  'Balanced': 'Mix of positions in early rounds.',
}

const STRATEGY_COLORS: Record<string, string> = {
  'Zero-RB':  'text-[#60a5fa]',
  'Hero-RB':  'text-[#22c55e]',
  'WR-Heavy': 'text-[#a78bfa]',
  'Balanced': 'text-[#94a3b8]',
}

interface Props {
  data: DraftStructureEntry[]
}

export default function DraftStructureTable({ data }: Props) {
  if (!data.length) {
    return (
      <div className="bg-s-bg2 border border-s-border rounded-[12px] p-[18px]">
        <div className="text-center py-8 text-s-text3 text-[12px]">No draft structure data available</div>
      </div>
    )
  }

  const best = data.reduce((prev, cur) => cur.avgFinish < prev.avgFinish ? cur : prev, data[0])

  return (
    <div className="bg-s-bg2 border border-s-border rounded-[12px] p-[18px]">
      <div className="text-[10px] font-bold tracking-[2.5px] uppercase text-s-text2 mb-1">
        Draft Strategy vs Season Outcome
      </div>
      <div className="text-[11px] text-s-text3 mb-4">
        Based on rounds 1–3 position selection across all seasons
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {data.map(entry => {
          const color = STRATEGY_COLORS[entry.strategy] ?? 'text-s-text2'
          const isBest = entry.strategy === best.strategy
          return (
            <div
              key={entry.strategy}
              className={`rounded-[10px] p-4 border ${isBest ? 'border-s-gold bg-[#1a1200]' : 'border-s-border bg-s-bg3'}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className={`text-[14px] font-extrabold ${color}`}>{entry.strategy}</span>
                  {isBest && (
                    <span className="ml-2 text-[9px] font-bold uppercase tracking-[1px] text-s-gold bg-[#3d2000] px-[6px] py-[2px] rounded-full border border-[#5a3200]">
                      Best Avg Finish
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

      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr className="text-[10px] font-bold tracking-[1px] uppercase text-s-text3 border-b border-s-border">
            <th className="text-left py-[5px] pr-3">Strategy</th>
            <th className="text-right py-[5px] pr-3">Seasons</th>
            <th className="text-right py-[5px] pr-3">Avg W</th>
            <th className="text-right py-[5px]">Avg Finish</th>
          </tr>
        </thead>
        <tbody>
          {data.map(entry => {
            const color = STRATEGY_COLORS[entry.strategy] ?? 'text-s-text2'
            return (
              <tr key={entry.strategy} className="border-b border-s-bg3">
                <td className={`py-[7px] pr-3 font-bold ${color}`}>{entry.strategy}</td>
                <td className="py-[7px] pr-3 text-right text-s-text2">{entry.count}</td>
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
