'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Activity } from 'lucide-react'
import { useLeague } from '@/context/LeagueContext'
import GlobalSearch from '@/components/search/GlobalSearch'
import MobileMenu from './MobileMenu'
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
      className="sticky top-0 z-50 border-b border-white/[0.07]"
      style={{
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        background: 'rgba(2, 6, 23, 0.88)',
      }}
    >
      <div className="max-w-[1200px] mx-auto flex items-center px-3 sm:px-0 sm:overflow-x-auto scrollbar-none">

        {/* Mobile menu trigger */}
        <MobileMenu />

        {/* Brand */}
        <Link
          href="/"
          className="px-2 sm:px-5 py-[15px] flex-shrink-0 flex items-center gap-2 sm:border-r border-white/[0.07]"
        >
          <Activity size={14} className="text-violet-500 flex-shrink-0" />
          <span
            className="text-[11px] font-black tracking-[3px] uppercase whitespace-nowrap"
            style={{
              background: 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            CONVICTS FF
          </span>
        </Link>

        {/* Nav links — desktop only; mobile uses the drawer */}
        <div className="hidden sm:flex">
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
                  'flex items-center gap-[5px] px-[12px] py-[15px] text-[10px] font-bold whitespace-nowrap',
                  'tracking-[1.2px] uppercase border-b-2 transition-all duration-150',
                  isActive
                    ? 'text-violet-400 border-violet-500'
                    : 'text-slate-600 border-transparent hover:text-slate-300 hover:border-white/20',
                ].join(' ')}
              >
                <Icon size={11} className="flex-shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </div>

        {/* Search + status pill */}
        <div className="ml-auto pl-2 sm:px-4 flex-shrink-0 flex items-center gap-2">
          <GlobalSearch />
          <div className="hidden lg:block text-[9px] font-semibold tracking-[1.5px] uppercase text-slate-600 bg-white/[0.04] px-3 py-1 rounded-full border border-white/[0.07] whitespace-nowrap">
            {statusText}
          </div>
        </div>
      </div>
    </nav>
  )
}
