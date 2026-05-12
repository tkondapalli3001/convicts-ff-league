'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLeague } from '@/context/LeagueContext'

const NAV_ITEMS = [
  { href: '/',             label: 'Home'         },
  { href: '/earnings',     label: 'Earnings'     },
  { href: '/owners',       label: 'Owners'       },
  { href: '/records',      label: 'Records'      },
  { href: '/trends',       label: 'Trends'       },
  { href: '/gamelog',      label: 'Game Log'     },
  { href: '/luck',         label: 'Luck Index'   },
  { href: '/players',      label: 'Players'      },
  { href: '/transactions', label: 'Transactions' },
]

export default function Navbar() {
  const pathname = usePathname()
  const { state } = useLeague()
  const { loaded, years, loadingText } = state

  const statusText = loaded && years.length > 0
    ? `${years[0]}–${years[years.length - 1]} · ${years.length} seasons`
    : loadingText

  return (
    <nav
      className="sticky top-0 z-50 border-b border-s-border/60"
      style={{
        backdropFilter: 'blur(16px) saturate(180%)',
        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
        background: 'rgba(14,17,23,0.85)',
      }}
    >
      <div className="max-w-[1200px] mx-auto flex items-center overflow-x-auto scrollbar-none">
        {/* Brand */}
        <div className="px-5 py-[15px] text-[12px] font-black tracking-[4px] uppercase whitespace-nowrap border-r border-s-border/50 flex-shrink-0 flex items-center gap-2">
          <span
            className="text-[13px] font-black tracking-[3px] uppercase"
            style={{
              background: 'linear-gradient(135deg, #00ceb8, #f59e0b)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            🏈 MC FF
          </span>
        </div>

        {/* Nav links — hidden on mobile */}
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
                  'px-[13px] py-[15px] text-[10px] font-bold whitespace-nowrap',
                  'tracking-[1.2px] uppercase border-b-2 transition-all duration-150',
                  isActive
                    ? 'text-s-teal border-s-teal'
                    : 'text-s-text3 border-transparent hover:text-s-text2 hover:border-s-border2',
                ].join(' ')}
              >
                {item.label}
              </Link>
            )
          })}
        </div>

        {/* Status pill */}
        <div className="ml-auto px-4 flex-shrink-0">
          <div className="text-[9px] font-semibold tracking-[1.5px] uppercase text-s-text3 bg-s-bg3/60 px-3 py-1 rounded-full border border-s-border/50 whitespace-nowrap">
            {statusText}
          </div>
        </div>
      </div>
    </nav>
  )
}
