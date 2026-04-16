import { Matchup } from '@/types'
import { ownerColor } from '@/lib/utils'

interface ScoreRow {
  owner: string
  pts: number
  year: number
  week: number
  opp: string
  oppPts: number
  result: 'W' | 'L'
}

interface Props {
  title: string
  scores: ScoreRow[]
  variant: 'high' | 'low'
  countByOwner: [string, number][]
}

export default function ScoreLeaderboard({ title, scores, variant, countByOwner }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-[14px] mb-4">
      <div className="bg-s-bg2 border border-s-border rounded-[12px] p-[14px]">
        <div className="text-[10px] font-bold tracking-[2.5px] uppercase text-s-text3 mb-3">
          Top 10 {variant === 'high' ? 'Highest' : 'Lowest'} Scores
        </div>
        {scores.slice(0, 10).map((s, rank) => (
          <div key={`${s.owner}-${s.year}-${s.week}`} className="flex items-center gap-2 py-[6px] border-b border-s-bg3 text-[12px]">
            <span className="w-5 text-s-text3 text-[10px]">{rank + 1}</span>
            <span className="font-bold w-[70px] flex-shrink-0" style={{ color: ownerColor(s.owner) }}>{s.owner}</span>
            <span className="font-mono text-s-gold w-[55px]">{s.pts.toFixed(2)}</span>
            <span className="text-s-text3 text-[10px] flex-1 truncate">vs {s.opp} · {s.year} W{s.week}</span>
            <span className={`px-[6px] py-[1px] rounded-[4px] text-[10px] font-extrabold ml-auto flex-shrink-0 ${s.result === 'W' ? 'bg-[#052e16] text-s-green' : 'bg-[#450a0a] text-s-red'}`}>
              {s.result}
            </span>
          </div>
        ))}
      </div>

      <div className="bg-s-bg2 border border-s-border rounded-[12px] p-[14px]">
        <div className="text-[10px] font-bold tracking-[2.5px] uppercase text-s-text3 mb-3">
          Most {variant === 'high' ? '140+' : 'Sub-80'} Games by Owner
        </div>
        {countByOwner.slice(0, 8).map(([owner, count], i) => (
          <div key={owner} className="flex items-center gap-2 py-[5px] border-b border-s-bg3">
            <span className="w-5 text-s-text3 text-[10px]">{i + 1}</span>
            <span className="font-bold flex-1" style={{ color: ownerColor(owner) }}>{owner}</span>
            <span className={`inline-flex items-center px-2 py-[2px] rounded-full text-[10px] font-bold border ${variant === 'high' ? 'bg-[#3d2000] text-s-gold border-[#5a3200]' : 'bg-[#3d0000] text-s-red border-[#5a0000]'}`}>
              {count}x
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
