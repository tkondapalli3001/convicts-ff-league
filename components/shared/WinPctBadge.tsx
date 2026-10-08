import { winPctColor } from '@/lib/utils'

interface Props {
  pct: string | number
}

/**
 * Midnight Prime Win% — Barlow Condensed numeral, semantically coloured to match the
 * standings tables: ≥55% gold-bright, 45–55% neutral, <45% brick. Shared across all tables.
 */
export default function WinPctBadge({ pct }: Props) {
  const v = typeof pct === 'number' ? pct.toFixed(1) : pct
  return (
    <span className="font-display text-[17px] font-bold" style={{ color: winPctColor(parseFloat(String(pct)) / 100) }}>
      {v}%
    </span>
  )
}
