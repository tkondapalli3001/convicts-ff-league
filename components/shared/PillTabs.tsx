'use client'

interface Props<T extends string> {
  tabs: readonly { id: T; label: string }[]
  active: T
  onChange: (id: T) => void
  /** Extra content rendered after the tabs (e.g. a right-aligned action button). */
  children?: React.ReactNode
}

/**
 * Midnight Prime tab bar (design artboards 3a / 4a): underline tabs on a hairline rule —
 * active = white + 2px gold underline, inactive = muted → gold-soft on hover. Horizontally
 * scrollable on mobile. Shared across records, owners, seasons, draft, players, game log.
 */
export default function PillTabs<T extends string>({ tabs, active, onChange, children }: Props<T>) {
  return (
    <div
      className="-mt-6 mb-5 flex items-center gap-1 overflow-x-auto border-b scrollbar-none"
      style={{ borderColor: 'rgba(var(--gold-rgb), 0.12)' }}
    >
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={[
            '-mb-px whitespace-nowrap border-b-2 px-3.5 py-3 text-[13px] font-bold uppercase tracking-[1.5px]',
            'transition-colors duration-150 active:scale-[0.98]',
            active === tab.id
              ? 'border-gold text-s-text'
              : 'border-transparent text-s-text3 hover:text-gold-soft',
          ].join(' ')}
        >
          {tab.label}
        </button>
      ))}
      {children}
    </div>
  )
}
