import OwnerAvatar from '@/components/shared/OwnerAvatar'
import SectionCard from '@/components/shared/SectionCard'

interface StreakEntry {
  owner: string
  streak: number
  startYear: number
  startWeek: number
  endYear: number
  endWeek: number
}

interface Props {
  title: string
  streaks: StreakEntry[]
  variant: 'win' | 'loss'
}

export default function StreakList({ title, streaks, variant }: Props) {
  const isWin = variant === 'win'

  return (
    <SectionCard title={title} brick={!isWin}>
      {streaks.map(({ owner, streak, startYear, startWeek, endYear, endWeek }) => (
        <div
          key={owner}
          className="flex items-center gap-3 border-b px-5 py-2.5 transition-colors last:border-b-0 hover:bg-[rgba(201,150,46,0.05)]"
          style={{ borderColor: 'rgba(255,255,255,0.04)' }}
        >
          <div style={!isWin ? { opacity: 0.75 } : undefined}>
            <OwnerAvatar name={owner} size="sm" />
          </div>
          <span className="w-[80px] flex-shrink-0 text-[13px] font-bold text-s-text">{owner}</span>
          <span
            className="w-9 flex-shrink-0 font-display text-[32px] font-bold leading-none"
            style={{ color: isWin ? '#7FA886' : '#B4636B' }}
          >
            {streak}
          </span>
          <span className="text-[10px] uppercase tracking-[0.5px] text-s-text3">
            {startYear} W{startWeek} → {endYear} W{endWeek}
          </span>
        </div>
      ))}
    </SectionCard>
  )
}
