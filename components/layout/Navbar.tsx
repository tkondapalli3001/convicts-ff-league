'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLeague } from '@/context/LeagueContext'

const NAV_ITEMS = [
  { href: '/',        label: 'Home'     },
  { href: '/earnings', label: 'Earnings' },
  { href: '/owners',   label: 'Owners'   },
  { href: '/records',  label: 'Records'  },
  { href: '/trends',   label: 'Trends'   },
  { href: '/gamelog',  label: 'Game Log' },
  { href: '/luck',     label: 'Luck Index' },
]

export default function Navbar() {
  const pathname = usePathname()
  const { state } = useLeague()
  const { loaded, years, loadingText } = state

  const statusText = loaded && years.length > 0
    ? `${years[0]}–${years[years.length - 1]} · ${years.length} seasons`
    : loadingText

  return (
    <nav className="bg-s-bg2 border-b border-s-border sticky top-0 z-50">
      <div className="max-w-[1200px] mx-auto flex items-center overflow-x-auto scrollbar-none">
        {/* Brand */}
        <div className="px-[18px] py-[14px] text-[13px] font-extrabold text-s-gold tracking-[3px] uppercase whitespace-nowrap border-r border-s-border flex-shrink-0">
          🏈 MC FF
        </div>

        {/* Nav links — hidden on mobile (bottom nav handles it) */}
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
                  'px-[14px] py-[14px] text-[11px] font-semibold whitespace-nowrap',
                  'tracking-[1px] uppercase border-b-2 transition-colors duration-150',
                  isActive
                    ? 'text-s-gold border-s-gold'
                    : 'text-s-text3 border-transparent hover:text-s-text2',
                ].join(' ')}
              >
                {item.label}
              </Link>
            )
          })}
        </div>

        {/* Status text */}
        <div className="ml-auto px-4 text-[10px] text-s-text3 whitespace-nowrap flex-shrink-0">
          {statusText}
        </div>
      </div>
    </nav>
  )
}
