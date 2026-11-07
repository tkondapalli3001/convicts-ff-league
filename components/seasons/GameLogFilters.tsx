'use client'

import FilterSheet from '@/components/shared/FilterSheet'

interface Props {
  years: number[]
  ownerNames: string[]
  activeYears: Set<number>
  activeOwners: Set<string>
  onToggleYear: (y: number) => void
  onToggleOwner: (name: string) => void
  /** How many games the filters leave. */
  shown: number
}

export default function GameLogFilters({ years, ownerNames, activeYears, activeOwners, onToggleYear, onToggleOwner, shown }: Props) {
  const yearLabel = years.length > 1 && activeYears.size === years.length ? 'All years' : [...activeYears].sort().join(', ')
  const summary = `${yearLabel} · ${activeOwners.size ? [...activeOwners].join(', ') : 'All owners'}`
  return (
    <FilterSheet summary={summary} result={`Show ${shown} matchup${shown === 1 ? '' : 's'}`} className="gl relative overflow-hidden p-3 mb-4">
      <div className="relative z-10">
      <div className="text-[10px] font-bold tracking-[2.5px] uppercase text-gold-soft mb-2">Filter by Year</div>
      <div className="flex gap-[6px] flex-wrap mb-3">
        {years.map(y => (
          <button
            key={y}
            onClick={() => onToggleYear(y)}
            className={[
              'min-h-[32px] sm:min-h-0 px-3 py-[5px] rounded-full border text-[11px] font-semibold cursor-pointer transition-all duration-150 whitespace-nowrap',
              activeYears.has(y)
                ? 'border-gold text-gold-soft bg-[rgba(201,150,46,0.10)]'
                : 'border-[rgba(230,190,90,0.14)] text-s-text3 hover:text-gold-soft',
            ].join(' ')}
          >
            {y}
          </button>
        ))}
      </div>

      <div className="text-[10px] font-bold tracking-[2.5px] uppercase text-gold-soft mb-2">Filter by Owner — tap to isolate, tap again to reset</div>
      <div className="flex gap-[6px] flex-wrap">
        {ownerNames.map(name => (
          <button
            key={name}
            onClick={() => onToggleOwner(name)}
            className={[
              'min-h-[32px] sm:min-h-0 px-3 py-[5px] rounded-full border text-[11px] font-semibold cursor-pointer transition-all duration-150 whitespace-nowrap',
              activeOwners.has(name)
                ? 'border-gold text-gold-soft bg-[rgba(201,150,46,0.10)]'
                : 'border-[rgba(230,190,90,0.14)] text-s-text3 hover:text-gold-soft',
            ].join(' ')}
          >
            {name}
          </button>
        ))}
      </div>
      </div>
    </FilterSheet>
  )
}
