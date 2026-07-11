'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { useLeague } from '@/context/LeagueContext'
import Brand from './Brand'
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
        className="sm:hidden flex-shrink-0 w-11 h-11 -ml-2 flex items-center justify-center text-gold-soft active:scale-[0.98] transition-transform"
        aria-label="Open menu"
      >
        <Menu size={18} />
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-[100] sm:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(3, 3, 4, 0.7)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
            onClick={() => setOpen(false)}
          />

          {/* Drawer */}
          <div
            className="absolute left-0 top-0 bottom-0 w-[280px] max-w-[84vw] flex flex-col border-r animate-slide-in-left"
            style={{
              background: '#070708',
              borderColor: 'rgba(var(--gold-rgb), 0.14)',
              paddingTop: 'env(safe-area-inset-top)',
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
          >
            {/* Brand row */}
            <div
              className="flex items-center gap-2 px-5 py-4 border-b"
              style={{ borderColor: 'rgba(var(--gold-rgb), 0.14)' }}
            >
              <Brand size="sm" />
              <button
                onClick={() => setOpen(false)}
                className="ml-auto p-1.5 -mr-1.5 text-s-text3 hover:text-gold-soft transition-colors"
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
                      'flex items-center gap-3 px-3 min-h-[44px] rounded-[2px]',
                      'text-[11px] font-bold tracking-[2px] uppercase transition-colors duration-150',
                      isActive
                        ? 'text-gold-soft'
                        : 'text-s-text3 hover:text-s-text',
                    ].join(' ')}
                    style={isActive ? { background: 'rgba(var(--gold2-rgb), 0.08)' } : undefined}
                  >
                    <Icon size={15} className={`flex-shrink-0 ${isActive ? 'text-gold-soft' : 'text-s-muted'}`} />
                    {item.label}
                    {isActive && <span className="ml-auto w-1 h-1 rounded-full bg-gold" />}
                  </Link>
                )
              })}
            </nav>

            {/* Status footer */}
            <div
              className="px-5 py-4 border-t"
              style={{ borderColor: 'rgba(var(--gold-rgb), 0.08)' }}
            >
              <div className="text-[9px] font-semibold tracking-[2px] uppercase text-s-text3">
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
