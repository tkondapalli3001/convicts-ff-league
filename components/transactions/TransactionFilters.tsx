'use client'

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
}

const TYPE_LABELS: Record<TxTypeFilter, string> = {
  trade:   'Trade',
  waivers: 'Waivers',
}

export default function TransactionFilters({
  years, owners, activeYears, activeOwners, activeTypes,
  onToggleYear, onToggleOwner, onToggleType,
}: Props) {
  const types: TxTypeFilter[] = ['trade', 'waivers']

  return (
    <div className="bg-s-bg2 border border-s-border rounded-[12px] p-[14px] mb-4">
      {/* Type filter */}
      <div className="mb-3">
        <div className="text-[9px] font-bold tracking-[2px] uppercase text-s-text3 mb-2">Type</div>
        <div className="flex gap-[6px] flex-wrap">
          {types.map(t => (
            <button
              key={t}
              onClick={() => onToggleType(t)}
              className={[
                'px-3 py-[4px] rounded-full border text-[11px] font-semibold cursor-pointer transition-all duration-150',
                activeTypes.has(t)
                  ? 'bg-[#1a2e4a] border-s-blue text-[#93c5fd]'
                  : 'bg-s-bg3 border-s-border text-s-text3 hover:border-s-border2 hover:text-s-text2',
              ].join(' ')}
            >
              {TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Year filter */}
      <div className="mb-3">
        <div className="text-[9px] font-bold tracking-[2px] uppercase text-s-text3 mb-2">Year</div>
        <div className="flex gap-[6px] flex-wrap">
          {years.map(y => (
            <button
              key={y}
              onClick={() => onToggleYear(y)}
              className={[
                'px-3 py-[4px] rounded-full border text-[11px] font-semibold cursor-pointer transition-all duration-150',
                activeYears.has(y)
                  ? 'bg-[#1a2e4a] border-s-blue text-[#93c5fd]'
                  : 'bg-s-bg3 border-s-border text-s-text3 hover:border-s-border2 hover:text-s-text2',
              ].join(' ')}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* Owner filter */}
      <div>
        <div className="text-[9px] font-bold tracking-[2px] uppercase text-s-text3 mb-2">Owner</div>
        <div className="flex gap-[6px] flex-wrap">
          {owners.map(name => (
            <button
              key={name}
              onClick={() => onToggleOwner(name)}
              className={[
                'px-3 py-[4px] rounded-full border text-[11px] font-semibold cursor-pointer transition-all duration-150',
                activeOwners.has(name)
                  ? 'bg-[#1a3020] border-s-green text-[#86efac]'
                  : 'bg-s-bg3 border-s-border text-s-text3 hover:border-s-border2 hover:text-s-text2',
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
