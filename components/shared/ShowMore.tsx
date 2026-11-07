'use client'

import { useState } from 'react'

const PAGE = 100

/**
 * Long lists render the first hundred rows and a button for the next hundred.
 * A new list (other filters) starts again at a hundred.
 */
export function useShowMore<T>(items: T[]) {
  const [state, setState] = useState({ items, limit: PAGE })
  const limit = state.items === items ? state.limit : PAGE
  return {
    shown: items.slice(0, limit),
    left: Math.max(0, items.length - limit),
    more: () => setState({ items, limit: limit + PAGE }),
  }
}

export function ShowMoreButton({ left, onClick }: { left: number; onClick: () => void }) {
  if (left <= 0) return null
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-[44px] w-full text-[10px] font-bold uppercase tracking-[2px] text-gold-soft transition-colors hover:bg-[rgba(var(--gold2-rgb),0.04)]"
    >
      Show {Math.min(left, PAGE)} more · {left} left
    </button>
  )
}
