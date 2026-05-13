'use client'

interface Props {
  years: number[]
  ownerNames: string[]
  activeYears: Set<number>
  activeOwners: Set<string>
  onToggleYear: (y: number) => void
  onToggleOwner: (name: string) => void
}

export default function GameLogFilters({ years, ownerNames, activeYears, activeOwners, onToggleYear, onToggleOwner }: Props) {
  return (
    <div className="gl relative overflow-hidden p-3 mb-4">
      <div className="bento-fill" style={{ background: 'rgba(59,130,246,0.15)' }} />
      <div className="relative z-10">
      <div className="text-[10px] font-bold tracking-[2.5px] uppercase text-slate-400 mb-2">Filter by Year</div>
      <div className="flex gap-[6px] flex-wrap mb-3">
        {years.map(y => (
          <button
            key={y}
            onClick={() => onToggleYear(y)}
            className={[
              'px-3 py-[5px] rounded-full border text-[11px] font-semibold cursor-pointer transition-all duration-150 whitespace-nowrap',
              activeYears.has(y)
                ? 'bg-[#1a2e4a] border-s-blue text-[#93c5fd]'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white bento-interactive',
            ].join(' ')}
          >
            {y}
          </button>
        ))}
      </div>

      <div className="text-[10px] font-bold tracking-[2.5px] uppercase text-slate-400 mb-2">Filter by Owner — click to isolate, click again to reset</div>
      <div className="flex gap-[6px] flex-wrap">
        {ownerNames.map(name => (
          <button
            key={name}
            onClick={() => onToggleOwner(name)}
            className={[
              'px-3 py-[5px] rounded-full border text-[11px] font-semibold cursor-pointer transition-all duration-150 whitespace-nowrap',
              activeOwners.has(name)
                ? 'bg-[#1a2e4a] border-s-blue text-[#93c5fd]'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white bento-interactive',
            ].join(' ')}
          >
            {name}
          </button>
        ))}
      </div>
      </div>
    </div>
  )
}
