'use client'

import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { useLeague } from '@/context/LeagueContext'
import SearchOverlay from './SearchOverlay'

/** Event name other components (e.g. the home hero input) fire to open the overlay. */
const OPEN_SEARCH_EVENT = 'convicts:open-search'

export function openLeagueSearch() {
  window.dispatchEvent(new CustomEvent(OPEN_SEARCH_EVENT))
}

export default function GlobalSearch() {
  const { state } = useLeague()
  const [open, setOpen] = useState(false)
  const ready = state.loaded

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!ready) return
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
    function onOpenEvent() { if (ready) setOpen(true) }
    document.addEventListener('keydown', onKey)
    window.addEventListener(OPEN_SEARCH_EVENT, onOpenEvent)
    return () => {
      document.removeEventListener('keydown', onKey)
      window.removeEventListener(OPEN_SEARCH_EVENT, onOpenEvent)
    }
  }, [open, ready])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={!ready}
        className="disabled:opacity-40 flex items-center justify-center gap-2 w-11 h-11 lg:w-auto lg:h-auto lg:justify-start lg:px-3 lg:py-[7px] lg:border lg:border-[rgba(230,190,90,0.18)] lg:rounded-[2px] text-gold-soft lg:text-s-text3 lg:hover:text-gold-soft lg:hover:border-[rgba(230,190,90,0.35)] transition-colors whitespace-nowrap"
        aria-label="Search the league"
      >
        <Search size={13} className="flex-shrink-0" />
        <span className="hidden lg:block text-[10px] font-semibold tracking-[1.5px] uppercase">Ask anything</span>
        <kbd className="hidden lg:block px-1.5 py-0.5 rounded-[2px] text-[9px] font-mono text-s-text3 border border-[rgba(230,190,90,0.18)]">⌘K</kbd>
      </button>

      {open && <SearchOverlay onClose={() => setOpen(false)} />}
    </>
  )
}
