'use client'

import type { Badge } from '@/lib/preview'

/** Key for the flair showing this week — only the badges somebody actually earned. */
export default function FlairLegend({ badges }: { badges: Badge[] }) {
  const unique = [...new Map(badges.map(b => [b.label, b])).values()]
  if (!unique.length) return null
  return (
    <div className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[11px] text-s-text3 sm:text-[13px]">
      {unique.map(b => (
        <span key={b.label} className="whitespace-nowrap">
          <span className="mr-1.5">{b.emoji}</span>
          <span className="font-semibold text-s-text2">{b.label}</span> · {b.rule}
        </span>
      ))}
    </div>
  )
}
