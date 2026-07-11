interface Props {
  /** Legacy emoji prop — retained for call-site compatibility; no longer rendered. */
  icon?: string
  label: string
  value: string | number
  context: string
}

/**
 * Midnight Prime record row (design 3a): label + context on the left, a big Barlow
 * Condensed gold-bright value on the right. Rendered inside a titled card with hairline
 * dividers — the row owns its bottom divider + gold hover wash.
 */
export default function RecordItem({ label, value, context }: Props) {
  return (
    <div
      className="flex items-center justify-between gap-4 border-b px-5 py-[13px] transition-colors last:border-b-0 hover:bg-[rgba(201,150,46,0.05)]"
      style={{ borderColor: 'rgba(255,255,255,0.04)' }}
    >
      <div className="min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-[2px] text-s-text2">{label}</div>
        <div className="mt-1 truncate text-[10px] tracking-[0.5px] text-s-text3">{context}</div>
      </div>
      <div className="flex-shrink-0 font-display text-[28px] font-bold leading-none text-gold-bright num">
        {value}
      </div>
    </div>
  )
}
