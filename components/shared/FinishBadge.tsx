interface Props {
  finish: number | null | undefined
}

/** Midnight Prime finish chip (design 4a): square bordered chip — 1st gold, 2nd silver, 3rd gold-dim, rest faint. */
export default function FinishBadge({ finish }: Props) {
  const base = 'inline-flex items-center gap-[3px] rounded-[2px] border px-2 py-[3px] text-[9px] font-bold uppercase tracking-[1.5px]'

  if (finish === 1)
    return (
      <span className={base} style={{ color: '#C9A24B', background: 'rgba(201,150,46,0.08)', borderColor: 'rgba(var(--gold-rgb), 0.25)' }}>
        🏆 1st
      </span>
    )
  if (finish === 2)
    return (
      <span className={base} style={{ color: '#D8D3C8', borderColor: 'rgba(255,255,255,0.14)' }}>2nd</span>
    )
  if (finish === 3)
    return (
      <span className={base} style={{ color: '#8A7439', borderColor: 'rgba(var(--gold-rgb), 0.16)' }}>3rd</span>
    )
  if (finish)
    return (
      <span className={base} style={{ color: '#9AA0AC', borderColor: 'rgba(255,255,255,0.10)' }}>{finish}th</span>
    )
  return (
    <span className={base} style={{ color: '#3A4150', borderColor: 'rgba(255,255,255,0.08)' }}>—</span>
  )
}
