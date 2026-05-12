'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLeague } from '@/context/LeagueContext'
import {
  Home, DollarSign, Users, Trophy, TrendingUp,
  CalendarDays, Shuffle, Zap, ArrowLeftRight, Activity,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/',             label: 'Home',         icon: Home           },
  { href: '/earnings',     label: 'Earnings',     icon: DollarSign     },
  { href: '/owners',       label: 'Owners',       icon: Users          },
  { href: '/records',      label: 'Records',      icon: Trophy         },
  { href: '/trends',       label: 'Trends',       icon: TrendingUp     },
  { href: '/gamelog',      label: 'Game Log',     icon: CalendarDays   },
  { href: '/luck',         label: 'Luck Index',   icon: Shuffle        },
  { href: '/players',      label: 'Players',      icon: Zap            },
  { href: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
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
      className="sticky top-0 z-50 border-b border-white/[0.07]"
      style={{
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        background: 'rgba(2, 6, 23, 0.88)',
      }}
    >
      <div className="max-w-[1200px] mx-auto flex items-center overflow-x-auto scrollbar-none">

        {/* Brand */}
        <div className="px-5 py-[15px] flex-shrink-0 flex items-center gap-2 border-r border-white/[0.07]">
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
        </div>

        {/* Nav links — hidden on mobile */}
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

        {/* Status pill */}
        <div className="ml-auto px-4 flex-shrink-0">
          <div className="text-[9px] font-semibold tracking-[1.5px] uppercase text-slate-600 bg-white/[0.04] px-3 py-1 rounded-full border border-white/[0.07] whitespace-nowrap">
            {statusText}
          </div>
        </div>
      </div>
    </nav>
  )
}
