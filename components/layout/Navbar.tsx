'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLeague } from '@/context/LeagueContext'
import GlobalSearch from '@/components/search/GlobalSearch'
import MobileMenu from './MobileMenu'
import Brand from './Brand'
import { NAV_ITEMS } from './nav-items'

export default function Navbar() {
  const pathname = usePathname()
  const { state } = useLeague()
  const { loaded, years, loadingText } = state

  const statusText = loaded && years.length > 0
    ? `${years[0]}–${years[years.length - 1]} · ${years.length} seasons`
    : loadingText

  return (
    <nav
      className="sticky top-0 z-50 bg-s-bg2 border-b"
      style={{ borderColor: 'rgba(var(--gold-rgb), 0.14)' }}
    >
      <div className="max-w-[1200px] mx-auto flex items-center px-3 sm:px-0 sm:overflow-x-auto scrollbar-none">

        {/* Mobile menu trigger */}
        <MobileMenu />

        {/* Brand */}
        <Link
          href="/"
          className="px-2 sm:px-6 py-3 flex-shrink-0 sm:border-r"
          style={{ borderColor: 'rgba(var(--gold-rgb), 0.10)' }}
        >
          <Brand />
        </Link>

        {/* Nav links — desktop only; mobile uses the drawer */}
        <div className="hidden sm:flex">
          {NAV_ITEMS.map(item => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  'px-4 pt-[19px] pb-[17px] text-[10px] whitespace-nowrap uppercase',
                  'tracking-[2.5px] border-b-2 transition-colors duration-150',
                  isActive
                    ? 'text-s-text font-bold border-gold'
                    : 'text-s-text3 font-semibold border-transparent hover:text-gold-soft',
                ].join(' ')}
              >
                {item.label}
              </Link>
            )
          })}
        </div>

        {/* Search + status */}
        <div className="ml-auto pl-2 sm:px-5 flex-shrink-0 flex items-center gap-4">
          <GlobalSearch />
          <div className="hidden lg:block text-[9px] font-semibold tracking-[2px] uppercase text-s-text3 whitespace-nowrap">
            {statusText}
          </div>
        </div>
      </div>
    </nav>
  )
}
