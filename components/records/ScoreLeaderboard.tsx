import OwnerAvatar from '@/components/shared/OwnerAvatar'
import SectionCard from '@/components/shared/SectionCard'

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
  const isHigh = variant === 'high'
  const valColor = isHigh ? 'text-gold-bright' : 'text-loss'
  const countColor = isHigh ? 'text-gold-soft' : 'text-loss'

  return (
    <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
      <SectionCard
        title={`${isHigh ? 'Highest' : 'Lowest'} Scores`}
        brick={!isHigh}
        action={<span className="text-[9px] uppercase tracking-[1.5px] text-s-text3">Top 5</span>}
      >
        {scores.slice(0, 5).map((s, rank) => (
          <div
            key={`${s.owner}-${s.year}-${s.week}`}
            className="flex items-center gap-3 border-b px-5 py-2 transition-colors last:border-b-0 hover:bg-[rgba(201,150,46,0.05)]"
            style={{ borderColor: 'rgba(255,255,255,0.04)' }}
          >
            <span className="w-5 flex-shrink-0 font-display text-[15px] font-bold text-[#3A4150]">{rank + 1}</span>
            <OwnerAvatar name={s.owner} size="sm" />
            <span className="w-[70px] flex-shrink-0 text-[12px] font-bold text-s-text">{s.owner}</span>
            <span className={`w-[62px] flex-shrink-0 font-display text-[19px] font-bold ${valColor}`}>
              {s.pts.toFixed(2)}
            </span>
            <span className="flex-1 truncate text-[10px] text-s-text3">
              vs {s.opp} · {s.year} W{s.week}
            </span>
            <span
              className="flex-shrink-0 rounded-[2px] px-2 py-[2px] text-[10px] font-extrabold"
              style={
                s.result === 'W'
                  ? { color: '#7FA886', background: 'rgba(127,168,134,0.12)' }
                  : { color: '#B4636B', background: 'rgba(180,99,107,0.12)' }
              }
            >
              {s.result}
            </span>
          </div>
        ))}
      </SectionCard>

      <SectionCard title={`Most ${isHigh ? '140+' : 'Sub-80'} Games by Manager`} brick={!isHigh}>
        <div className="grid grid-cols-1 sm:grid-cols-2">
          {countByOwner.slice(0, 5).map(([owner, count]) => (
            <div
              key={owner}
              className="flex items-center gap-2.5 border-b px-5 py-2.5"
              style={{ borderColor: 'rgba(255,255,255,0.04)' }}
            >
              <OwnerAvatar name={owner} size="sm" />
              <span className="flex-1 truncate text-[12px] font-bold text-s-text">{owner}</span>
              <span className={`font-display text-[17px] font-bold ${countColor}`}>{count}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}
