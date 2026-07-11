'use client'

import { Search } from 'lucide-react'
import { openLeagueSearch } from '@/components/search/GlobalSearch'

/**
 * Full-width Midnight Prime search strip — sits under the navbar on the home page.
 * A visual affordance for the global search; opens the existing GlobalSearch overlay.
 */
export default function SearchStrip() {
  return (
    <button
      onClick={openLeagueSearch}
      className="flex w-full items-center gap-3.5 px-5 py-3.5 border-b bg-panel-2 text-left transition-colors hover:bg-[rgba(201,150,46,0.05)]"
      style={{ borderColor: 'rgba(var(--gold-rgb), 0.10)' }}
    >
      {/* Gold dash */}
      <span className="hidden sm:block w-4 h-px flex-shrink-0 bg-gold" />
      <Search size={13} className="flex-shrink-0 text-gold-dim" />
      <span className="flex-1 truncate text-[12px] tracking-[0.5px] text-s-text3">
        Ask anything — “Teja vs Nathan”, “Who won in 2022?”, “Longest streak”…
      </span>
      <kbd
        className="hidden sm:block flex-shrink-0 px-2 py-[3px] rounded-[2px] text-[9px] font-mono text-s-text3 border"
        style={{ borderColor: 'rgba(var(--gold-rgb), 0.18)' }}
      >
        ⌘K
      </kbd>
    </button>
  )
}
