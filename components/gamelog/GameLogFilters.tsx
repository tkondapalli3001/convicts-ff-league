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
    <div className="bg-s-bg2 border border-s-border rounded-[12px] p-3 mb-4">
      <div className="text-[10px] font-bold tracking-[2.5px] uppercase text-s-text3 mb-2">Filter by Year</div>
      <div className="flex gap-[6px] flex-wrap mb-3">
        {years.map(y => (
          <button
            key={y}
            onClick={() => onToggleYear(y)}
            className={[
              'px-3 py-[5px] rounded-full border text-[11px] font-semibold cursor-pointer transition-all duration-150 whitespace-nowrap',
              activeYears.has(y)
                ? 'bg-[#1a2e4a] border-s-blue text-[#93c5fd]'
                : 'bg-s-bg3 border-s-border text-s-text3 hover:border-s-border2 hover:text-s-text2',
            ].join(' ')}
          >
            {y}
          </button>
        ))}
      </div>

      <div className="text-[10px] font-bold tracking-[2.5px] uppercase text-s-text3 mb-2">Filter by Owner — click to isolate, click again to reset</div>
      <div className="flex gap-[6px] flex-wrap">
        {ownerNames.map(name => (
          <button
            key={name}
            onClick={() => onToggleOwner(name)}
            className={[
              'px-3 py-[5px] rounded-full border text-[11px] font-semibold cursor-pointer transition-all duration-150 whitespace-nowrap',
              activeOwners.has(name)
                ? 'bg-[#1a2e4a] border-s-blue text-[#93c5fd]'
                : 'bg-s-bg3 border-s-border text-s-text3 hover:border-s-border2 hover:text-s-text2',
            ].join(' ')}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  )
}
