
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
    <div className="bg-s-bg2 border border-s-border rounded-[12px] p-[14px]">
      <div className="text-[10px] font-bold tracking-[2.5px] uppercase text-s-text3 mb-3">{title}</div>
      {streaks.map(({ owner, streak, startYear, startWeek, endYear, endWeek }) => (
        <div key={owner} className="flex items-center gap-2 py-[6px] border-b border-s-bg3 text-[12px]">
          <span className="font-bold w-[75px] flex-shrink-0 text-s-text">{owner}</span>
          <span className={`text-[20px] font-extrabold w-8 ${variant === 'win' ? 'text-s-green' : 'text-s-red'}`}>
            {streak}
          </span>
          <span className="text-s-text3 text-[10px]">
            {startYear} W{startWeek} → {endYear} W{endWeek}
          </span>
        </div>
      ))}
    </div>
  )
}
