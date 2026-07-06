'use client'

interface Props<T extends string> {
  tabs: readonly { id: T; label: string }[]
  active: T
  onChange: (id: T) => void
  /** Extra content rendered after the tabs (e.g. a right-aligned action button). */
  children?: React.ReactNode
}

/** Gold pill tab row used across pages (draft, players, owners, records, seasons). */
export default function PillTabs<T extends string>({ tabs, active, onChange, children }: Props<T>) {
  return (
    <div className="flex items-center gap-[6px] mb-5 flex-wrap">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={[
            'px-4 py-[7px] rounded-[8px] border text-[12px] font-bold transition-all duration-150 cursor-pointer active:scale-[0.98]',
            active === tab.id
              ? 'bg-s-gold text-[#000] border-s-gold shadow-[0_0_16px_rgba(56,189,248,0.15)]'
              : 'bg-white/5 border-white/10 text-slate-400 hover:text-white bento-interactive',
          ].join(' ')}
        >
          {tab.label}
        </button>
      ))}
      {children}
    </div>
  )
}
