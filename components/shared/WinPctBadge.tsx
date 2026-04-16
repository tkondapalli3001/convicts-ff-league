import { pctClass } from '@/lib/utils'

interface Props {
  pct: string | number
}

const STYLES = {
  good: 'bg-[#052e16] text-s-green',
  mid:  'bg-[#1a1500] text-s-gold',
  bad:  'bg-[#3d0000] text-s-red',
}

export default function WinPctBadge({ pct }: Props) {
  const cls = pctClass(pct)
  return (
    <span className={`inline-block px-[7px] py-[2px] rounded-[6px] text-[11px] font-bold ${STYLES[cls]}`}>
      {typeof pct === 'number' ? pct.toFixed(1) : pct}%
    </span>
  )
}
