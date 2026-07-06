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
        className="flex items-center gap-2 px-3 py-[6px] rounded-full border border-white/[0.07] bg-white/[0.04] text-slate-500 hover:text-slate-300 hover:border-white/20 transition-all whitespace-nowrap"
        aria-label="Search the league"
      >
        <Search size={11} className="flex-shrink-0" />
        <span className="hidden md:block text-[10px] font-semibold tracking-[1px] uppercase">Ask anything</span>
        <kbd className="hidden md:block px-1.5 py-0.5 rounded text-[9px] font-mono bg-white/[0.05] border border-white/[0.07]">⌘K</kbd>
      </button>

      {open && <SearchOverlay onClose={() => setOpen(false)} />}
    </>
  )
}
