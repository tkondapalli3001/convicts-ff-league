'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home, DollarSign, Users, Trophy,
  CalendarDays, Zap, ClipboardList,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/',         label: 'Home',    icon: Home          },
  { href: '/owners',   label: 'Owners',  icon: Users         },
  { href: '/earnings', label: 'Cash',    icon: DollarSign    },
  { href: '/draft',    label: 'Draft',   icon: ClipboardList },
  { href: '/gamelog',  label: 'Seasons', icon: CalendarDays  },
  { href: '/records',  label: 'Records', icon: Trophy        },
  { href: '/players',  label: 'Players', icon: Zap           },
]

export default function MobileNav() {
  const pathname = usePathname()

  return (
    <div
      className="sm:hidden fixed bottom-0 left-0 right-0 border-t border-white/[0.07] z-50"
      style={{
        background: 'rgba(2, 6, 23, 0.96)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className="flex">
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
                'flex-1 flex flex-col items-center justify-center py-2 gap-[3px]',
                'text-[9px] font-bold tracking-[0.5px] uppercase transition-colors duration-150',
                isActive ? 'text-violet-400' : 'text-slate-600',
              ].join(' ')}
            >
              <Icon
                size={18}
                className={isActive ? 'text-violet-400' : 'text-slate-600'}
              />
              {item.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
