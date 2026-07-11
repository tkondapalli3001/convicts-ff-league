'use client'

/**
 * Midnight Prime stat-band cell (design artboard 2a/2b): a micro-label, a big Barlow
 * Condensed numeral, and a gold-soft attribution line. Rendered inside a hairline grid
 * (see the home stat band) — the cell owns its right/bottom dividers + gold hover wash.
 */
export default function StatChip({
  label,
  value,
  sub,
  animClass,
}: {
  label: string
  value: string | number
  sub?: string
  /** Legacy accent prop — retained for call-site compatibility; no longer rendered. */
  accent?: string
  animClass?: string
}) {
  return (
    <div
      className={`flex flex-col gap-1.5 border-b border-r px-5 py-5 transition-colors hover:bg-[rgba(201,150,46,0.04)] sm:px-8 sm:py-[26px] ${animClass ?? ''}`}
      style={{ borderColor: 'rgba(var(--gold-rgb), 0.10)' }}
    >
      <div className="text-[8px] font-bold uppercase tracking-[2px] text-s-text3 sm:text-[9px] sm:tracking-[3px]">
        {label}
      </div>
      <div className="font-display text-[30px] font-bold leading-none text-s-text sm:text-[44px]">
        {value}
      </div>
      {sub && (
        <div className="truncate text-[9px] font-semibold uppercase tracking-[1px] text-gold-soft sm:text-[10px] sm:tracking-[1.5px]">
          {sub}
        </div>
      )}
    </div>
  )
}
