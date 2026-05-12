import OwnerAvatar from '@/components/shared/OwnerAvatar'

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
  return (
    <div className="gl p-[14px]">
      <div className="text-[10px] font-bold tracking-[2.5px] uppercase text-s-text3 mb-3">{title}</div>
      {streaks.map(({ owner, streak, startYear, startWeek, endYear, endWeek }) => (
        <div key={owner} className="flex items-center gap-2 py-[6px] border-b border-s-bg3 text-[12px]">
          <OwnerAvatar name={owner} size="sm" />
          <span className="font-bold w-[70px] flex-shrink-0 text-s-text">{owner}</span>
          <span className={`text-[20px] font-extrabold w-8 num ${variant === 'win' ? 'text-s-green' : 'text-s-red'}`}>
            {streak}
          </span>
          <span className="text-s-text2 text-[10px]">
            {startYear} W{startWeek} → {endYear} W{endWeek}
          </span>
        </div>
      ))}
    </div>
  )
}
