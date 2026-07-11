'use client'

import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { useLeague } from '@/context/LeagueContext'
import SearchOverlay from './SearchOverlay'

/** Event name other components (e.g. the home hero input) fire to open the overlay. */
export const OPEN_SEARCH_EVENT = 'convicts:open-search'

export function openLeagueSearch() {
  window.dispatchEvent(new CustomEvent(OPEN_SEARCH_EVENT))
}

export default function GlobalSearch() {
  const { state } = useLeague()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(o => !o)
        return
      }
      if (e.key === '/' && !open) {
        const el = document.activeElement
        const typing = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement ||
          (el instanceof HTMLElement && el.isContentEditable)
        if (!typing) {
          e.preventDefault()
          setOpen(true)
        }
      }
      if (e.key === 'Escape' && open) setOpen(false)
    }
    function onOpenEvent() { setOpen(true) }
    document.addEventListener('keydown', onKey)
    window.addEventListener(OPEN_SEARCH_EVENT, onOpenEvent)
    return () => {
      document.removeEventListener('keydown', onKey)
      window.removeEventListener(OPEN_SEARCH_EVENT, onOpenEvent)
    }
  }, [open])

  if (!state.loaded) return null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-2 w-11 h-11 md:w-auto md:h-auto md:justify-start md:px-3 md:py-[7px] md:border md:border-[rgba(230,190,90,0.18)] md:rounded-[2px] text-gold-soft md:text-s-text3 md:hover:text-gold-soft md:hover:border-[rgba(230,190,90,0.35)] transition-colors whitespace-nowrap"
        aria-label="Search the league"
      >
        <Search size={13} className="flex-shrink-0" />
        <span className="hidden md:block text-[10px] font-semibold tracking-[1.5px] uppercase">Ask anything</span>
        <kbd className="hidden md:block px-1.5 py-0.5 rounded-[2px] text-[9px] font-mono text-s-text3 border border-[rgba(230,190,90,0.18)]">⌘K</kbd>
      </button>

      {open && <SearchOverlay onClose={() => setOpen(false)} />}
    </>
  )
}
