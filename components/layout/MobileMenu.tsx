'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Activity } from 'lucide-react'
import { useLeague } from '@/context/LeagueContext'
import { NAV_ITEMS } from './nav-items'

/**
 * Mobile navigation: hamburger next to the brand opening a slide-in drawer.
 * Portaled to document.body — the navbar's backdrop-filter would trap a
 * fixed-position drawer rendered inside it (same rule as the search overlay).
 */
export default function MobileMenu() {
  const pathname = usePathname()
  const { state } = useLeague()
  const [open, setOpen] = useState(false)

  const { loaded, years, loadingText } = state
  const statusText = loaded && years.length > 0
    ? `${years[0]}–${years[years.length - 1]} · ${years.length} seasons`
    : loadingText

  // Close on route change so the drawer never lingers over a new page
  useEffect(() => { setOpen(false) }, [pathname])

  // Esc closes; page scroll locks while open
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="sm:hidden flex-shrink-0 p-2 -mr-1 rounded-[8px] text-slate-400 hover:text-slate-200 active:scale-[0.98] transition-all"
        aria-label="Open menu"
      >
        <Menu size={17} />
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-[100] sm:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(2, 6, 23, 0.6)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
            onClick={() => setOpen(false)}
          />

          {/* Drawer */}
          <div
            className="absolute left-0 top-0 bottom-0 w-[280px] max-w-[84vw] flex flex-col border-r border-white/[0.07] animate-slide-in-left"
            style={{
              background: 'rgba(8, 12, 20, 0.98)',
              paddingTop: 'env(safe-area-inset-top)',
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
          >
            {/* Brand row */}
            <div className="flex items-center gap-2 px-5 py-4 border-b border-white/[0.07]">
              <Activity size={14} className="text-violet-500 flex-shrink-0" />
              <span
                className="text-[11px] font-black tracking-[3px] uppercase"
                style={{
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                CONVICTS FF
              </span>
              <button
                onClick={() => setOpen(false)}
                className="ml-auto p-1.5 -mr-1.5 rounded-full text-slate-500 hover:text-slate-200 active:bg-white/[0.06] transition-colors"
                aria-label="Close menu"
              >
                <X size={16} />
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
              {NAV_ITEMS.map(item => {
                const Icon = item.icon
                const isActive =
                  item.href === '/'
                    ? pathname === '/'
                    : pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      'flex items-center gap-3 px-3 py-[11px] rounded-[10px]',
                      'text-[11px] font-bold tracking-[1.5px] uppercase transition-colors duration-150',
                      isActive
                        ? 'text-violet-400 bg-violet-500/[0.08]'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]',
                    ].join(' ')}
                  >
                    <Icon size={15} className="flex-shrink-0" />
                    {item.label}
                    {isActive && <span className="ml-auto w-1 h-1 rounded-full bg-violet-400" />}
                  </Link>
                )
              })}
            </nav>

            {/* Status footer */}
            <div className="px-5 py-4 border-t border-white/[0.07]">
              <div className="text-[9px] font-semibold tracking-[1.5px] uppercase text-slate-600">
                {statusText}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
