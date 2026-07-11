'use client'

import { Matchup } from '@/types'
import { fmtPts } from '@/lib/utils'
import OwnerAvatar from '@/components/shared/OwnerAvatar'

interface Props {
  matchups: Matchup[]
  onClick?: (m: Matchup) => void
}

export default function GameLogTable({ matchups, onClick }: Props) {
  if (!matchups.length) {
    return (
      <div className="text-center py-10 text-s-text3">No matchups match your filters</div>
    )
  }

  return (
    <div className="gl overflow-hidden relative">
      <div className="bento-fill" style={{ background: 'rgba(59,130,246,0.15)' }} />
      <div className="max-h-[600px] overflow-y-auto overflow-x-auto relative z-10" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="min-w-[520px]">
        {matchups.map(g => {
          const winner1 = g.pts1 >= g.pts2
          return (
            <div
              key={`${g.year}-${g.week}-${g.team1}-${g.team2}`}
              className="flex items-center gap-[6px] px-3 py-[9px] border-b border-s-bg3 text-[12px] cursor-pointer hover:bg-s-bg3 transition-colors duration-100"
              onClick={() => onClick?.(g)}
            >
              <span className="w-[60px] text-s-text2 text-[10px] flex-shrink-0 num">{g.year} W{g.week}</span>

              {/* Team 1 */}
              <div className="flex items-center gap-1.5 w-[90px] flex-shrink-0">
                <OwnerAvatar name={g.team1} size="sm" />
                <span className={`font-bold overflow-hidden text-ellipsis ${winner1 ? 'text-s-text' : 'text-s-text2'}`}>
                  {g.team1}
                </span>
              </div>
              <span className={`w-[52px] flex-shrink-0 num ${winner1 ? 'text-s-green font-bold' : 'text-s-text3'}`}>
                {fmtPts(g.pts1)}
              </span>

              {/* vs */}
              <span className="text-s-text3 text-[10px] flex-shrink-0">vs</span>

              {/* Team 2 */}
              <span className={`w-[52px] flex-shrink-0 num ${!winner1 ? 'text-s-green font-bold' : 'text-s-text3'}`}>
                {fmtPts(g.pts2)}
              </span>
              <div className="flex items-center gap-1.5 w-[90px] flex-shrink-0">
                <OwnerAvatar name={g.team2} size="sm" />
                <span className={`font-bold overflow-hidden text-ellipsis ${!winner1 ? 'text-s-text' : 'text-s-text2'}`}>
                  {g.team2}
                </span>
              </div>

              {/* Type badge */}
              <span className="inline-block px-2 py-[2px] rounded-full text-[10px] font-bold bg-s-bg4 text-s-text3 border border-s-border flex-shrink-0">
                {g.type === 'R' ? 'REG' : 'PLY'}
              </span>

              {/* Margin */}
              <span className="text-[11px] ml-auto flex-shrink-0 text-s-text3 num">
                +{g.margin.toFixed(1)}
              </span>
            </div>
          )
        })}
        </div>
      </div>
    </div>
  )
}
