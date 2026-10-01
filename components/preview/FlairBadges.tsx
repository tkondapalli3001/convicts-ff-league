'use client'

import type { Badge } from '@/lib/preview'

/** A team's emoji flair; hover (or long-press) explains each one. */
export default function FlairBadges({ badges, className = '' }: { badges: Badge[]; className?: string }) {
  if (!badges.length) return null
  return (
    <span className={`inline-flex flex-shrink-0 items-center gap-0.5 leading-none ${className}`}>
      {badges.map(b => (
        <span key={b.label} role="img" aria-label={`${b.label}: ${b.detail}`} title={`${b.label} — ${b.detail}`}>
          {b.emoji}
        </span>
      ))}
    </span>
  )
}
