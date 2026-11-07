'use client'

import FilterSheet from '@/components/shared/FilterSheet'

export type TxTypeFilter = 'trade' | 'waivers'

interface Props {
  years: number[]
  owners: string[]
  activeYears: Set<number>
  activeOwners: Set<string>
  activeTypes: Set<TxTypeFilter>
  onToggleYear: (y: number) => void
  onToggleOwner: (name: string) => void
  onToggleType: (t: TxTypeFilter) => void
  /** Every year at once. */
  onAllYears?: () => void
  /** How many moves the filters leave. */
  shown: number
}

const TYPE_LABELS: Record<TxTypeFilter, string> = {
  trade:   'Trade',
  waivers: 'Waivers',
}

export default function TransactionFilters({
  years, owners, activeYears, activeOwners, activeTypes,
  onToggleYear, onToggleOwner, onToggleType, onAllYears, shown,
}: Props) {
  const types: TxTypeFilter[] = ['trade', 'waivers']
  const allYears = years.length > 1 && activeYears.size === years.length
  const yearLabel = allYears ? 'All years' : activeYears.size > 3 ? `${activeYears.size} years` : [...activeYears].sort().join(', ')
  const summary = [
    activeTypes.size === types.length ? 'Trades & waivers' : `${TYPE_LABELS[[...activeTypes][0]]} only`,
    years.length > 1 ? yearLabel : null,
    activeOwners.size ? [...activeOwners].join(', ') : 'All owners',
  ].filter(Boolean).join(' · ')

  return (
    <FilterSheet summary={summary} result={`Show ${shown} move${shown === 1 ? '' : 's'}`} className="gl relative overflow-hidden rounded-[12px] p-[14px] mb-4">
      {/* Type filter */}
      <div className="mb-3 relative z-10">
        <div className="text-[9px] font-bold tracking-[2px] uppercase text-gold-soft mb-2">Type</div>
        <div className="flex gap-[6px] flex-wrap">
          {types.map(t => (
            <button
              key={t}
              onClick={() => onToggleType(t)}
              className={[
                'min-h-[32px] sm:min-h-0 px-3 py-[4px] rounded-full border text-[11px] font-semibold cursor-pointer transition-all duration-150',
                activeTypes.has(t)
                  ? 'border-gold text-gold-soft bg-[rgba(201,150,46,0.10)]'
                  : 'border-[rgba(230,190,90,0.14)] text-s-text3 hover:text-gold-soft',
              ].join(' ')}
            >
              {TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Year filter — hidden for a single-season view */}
      {years.length > 1 && (
        <div className="mb-3 relative z-10">
          <div className="text-[9px] font-bold tracking-[2px] uppercase text-gold-soft mb-2">Year</div>
          <div className="flex gap-[6px] flex-wrap">
            {onAllYears && (
              <button
                onClick={onAllYears}
                className={[
                  'min-h-[32px] sm:min-h-0 px-3 py-[4px] rounded-full border text-[11px] font-semibold cursor-pointer transition-all duration-150',
                  allYears
                    ? 'border-gold text-gold-soft bg-[rgba(201,150,46,0.10)]'
                    : 'border-[rgba(230,190,90,0.14)] text-s-text3 hover:text-gold-soft',
                ].join(' ')}
              >
                All
              </button>
            )}
            {years.map(y => (
              <button
                key={y}
                onClick={() => onToggleYear(y)}
                className={[
                  'min-h-[32px] sm:min-h-0 px-3 py-[4px] rounded-full border text-[11px] font-semibold cursor-pointer transition-all duration-150',
                  activeYears.has(y)
                    ? 'border-gold text-gold-soft bg-[rgba(201,150,46,0.10)]'
                    : 'border-[rgba(230,190,90,0.14)] text-s-text3 hover:text-gold-soft',
                ].join(' ')}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Owner filter */}
      <div className="relative z-10">
        <div className="text-[9px] font-bold tracking-[2px] uppercase text-gold-soft mb-2">Owner</div>
        <div className="flex gap-[6px] flex-wrap">
          {owners.map(name => (
            <button
              key={name}
              onClick={() => onToggleOwner(name)}
              className={[
                'min-h-[32px] sm:min-h-0 px-3 py-[4px] rounded-full border text-[11px] font-semibold cursor-pointer transition-all duration-150',
                activeOwners.has(name)
                  ? 'bg-[#1a3020] border-s-green text-[#86efac]'
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
