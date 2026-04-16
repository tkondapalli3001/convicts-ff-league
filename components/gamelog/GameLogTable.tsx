'use client'

import { Matchup } from '@/types'
import { fmtPts } from '@/lib/utils'

interface Props {
  matchups: Matchup[]
  onDoubleClick?: (m: Matchup) => void
}

export default function GameLogTable({ matchups, onDoubleClick }: Props) {
  if (!matchups.length) {
    return (
      <div className="text-center py-10 text-s-text3">No matchups match your filters</div>
    )
  }

  return (
    <div className="bg-s-bg2 border border-s-border rounded-[12px] overflow-hidden">
      <div className="max-h-[600px] overflow-y-auto">
        {matchups.map(g => {
          const winner1 = g.pts1 >= g.pts2
          return (
            <div
              key={`${g.year}-${g.week}-${g.team1}-${g.team2}`}
              className="flex items-center gap-[6px] px-3 py-[9px] border-b border-s-bg3 text-[12px] cursor-pointer hover:bg-[#0f172a]"
              onDoubleClick={() => onDoubleClick?.(g)}
            >
              <span className="w-[60px] text-s-text3 text-[10px] flex-shrink-0">{g.year} W{g.week}</span>

              {/* Team 1 */}
              <span className={`font-bold w-[70px] flex-shrink-0 overflow-hidden text-ellipsis ${winner1 ? 'text-s-text' : 'text-s-text2'}`}>
                {g.team1}
              </span>
              <span className={`font-mono w-[52px] flex-shrink-0 ${winner1 ? 'text-s-green font-bold' : 'text-s-text3'}`}>
                {fmtPts(g.pts1)}
              </span>

              {/* vs */}
              <span className="text-s-text3 text-[10px] flex-shrink-0">vs</span>

              {/* Team 2 */}
              <span className={`font-mono w-[52px] flex-shrink-0 ${!winner1 ? 'text-s-green font-bold' : 'text-s-text3'}`}>
                {fmtPts(g.pts2)}
              </span>
              <span className={`font-bold w-[70px] flex-shrink-0 overflow-hidden text-ellipsis ${!winner1 ? 'text-s-text' : 'text-s-text2'}`}>
                {g.team2}
              </span>

              {/* Type badge */}
              <span className="inline-block px-2 py-[2px] rounded-full text-[10px] font-bold bg-s-bg4 text-s-text3 border border-s-border flex-shrink-0">
                {g.type === 'R' ? 'REG' : 'PLY'}
              </span>

              {/* Winner */}
              <span className="hidden sm:block flex-shrink-0 text-[11px] font-bold text-s-green">
                {g.winner} W
              </span>

              {/* Margin */}
              <span className="font-mono text-[11px] ml-auto flex-shrink-0 text-s-text3">
                +{g.margin.toFixed(1)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
