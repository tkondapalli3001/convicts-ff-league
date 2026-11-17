'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLeague } from '@/context/LeagueContext'
import GlobalSearch from '@/components/search/GlobalSearch'
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
      style={{ borderColor: 'rgba(var(--gold-rgb), 0.14)', paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="max-w-[1200px] mx-auto flex items-center px-3 lg:px-0">

        {/* Brand */}
        <Link
          href="/"
          className="px-2 py-3 flex-shrink-0 lg:border-r lg:px-5"
          style={{ borderColor: 'rgba(var(--gold-rgb), 0.10)' }}
        >
          <Brand />
        </Link>

        {/* Nav links from 1024px; phones and tablets use the bottom bar. If they ever
            outgrow the row, the links scroll and search stays put. */}
        <div className="hidden min-w-0 flex-1 overflow-x-auto scrollbar-none lg:flex">
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
                  'px-3.5 pt-[19px] pb-[17px] text-[10px] whitespace-nowrap uppercase',
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
        <div className="ml-auto pl-2 flex-shrink-0 flex items-center gap-3 lg:px-4">
          <GlobalSearch />
          <div className="hidden xl:block text-[9px] font-semibold tracking-[2px] uppercase text-s-text3 whitespace-nowrap">
            {statusText}
          </div>
        </div>
      </div>
    </nav>
  )
}
