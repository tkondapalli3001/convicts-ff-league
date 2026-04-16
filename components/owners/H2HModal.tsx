'use client'

import { Matchup } from '@/types'
import { fmtPts } from '@/lib/utils'

interface Props {
  p1: string
  p2: string
  games: Matchup[]
  onClose: () => void
}

export default function H2HModal({ p1, p2, games, onClose }: Props) {
  let w1 = 0, l1 = 0

  const rows = games.map(g => {
    const p1Pts = g.team1 === p1 ? g.pts1 : g.pts2
    const p2Pts = g.team1 === p1 ? g.pts2 : g.pts1
    const p1Won = p1Pts >= p2Pts
    if (p1Won) w1++; else l1++
    const margin = p1Pts - p2Pts
    return { g, p1Pts, p2Pts, p1Won, margin }
  })

  // Compute after loop to get final counts
  const title = `${p1} vs ${p2} — ${w1}:${games.length - w1}`

  return (
    <div
      className="fixed inset-0 bg-black/80 z-[500] flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-s-bg2 border border-s-border rounded-[14px] p-5 max-w-[520px] w-full max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-[14px]">
          <span className="text-[16px] font-extrabold text-s-text">{title}</span>
          <button
            onClick={onClose}
            className="text-[20px] text-s-text3 bg-none border-none cursor-pointer hover:text-s-text transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Game rows */}
        <div className="max-h-[400px] overflow-y-auto rounded-[10px] bg-s-bg2 border border-s-border">
          {rows.map(({ g, p1Pts, p2Pts, p1Won, margin }) => (
            <div
              key={`${g.year}-${g.week}`}
              className="flex items-center gap-[6px] px-3 py-[9px] border-b border-s-bg3 text-[12px] hover:bg-[#0f172a]"
            >
              <span className="w-[60px] text-s-text3 text-[10px] flex-shrink-0">{g.year} W{g.week}</span>
              <span className="font-bold w-[72px] flex-shrink-0 overflow-hidden text-ellipsis text-s-text">{p1}</span>
              <span className="w-[50px] flex-shrink-0 font-mono text-[12px]">{fmtPts(p1Pts)}</span>
              <span className="text-s-text3 text-[10px] flex-shrink-0">vs</span>
              <span className="font-bold w-[72px] flex-shrink-0 overflow-hidden text-ellipsis text-s-text">{p2}</span>
              <span className="w-[50px] flex-shrink-0 font-mono text-[12px]">{fmtPts(p2Pts)}</span>
              <span className={`px-[6px] py-[1px] rounded-[4px] text-[10px] font-extrabold flex-shrink-0 ${p1Won ? 'bg-[#052e16] text-s-green' : 'bg-[#450a0a] text-s-red'}`}>
                {p1Won ? `${p1} W` : `${p2} W`}
              </span>
              <span className={`font-mono text-[11px] ml-auto flex-shrink-0 ${margin >= 0 ? 'text-s-green' : 'text-s-red'}`}>
                {margin >= 0 ? '+' : ''}{margin.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
