'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/',         label: 'Home',    icon: '🏠' },
  { href: '/earnings', label: 'Cash',    icon: '💰' },
  { href: '/owners',   label: 'Owners',  icon: '👤' },
  { href: '/records',  label: 'Records', icon: '🏆' },
  { href: '/trends',   label: 'Trends',  icon: '📈' },
  { href: '/gamelog',  label: 'Games',   icon: '📋' },
  { href: '/luck',     label: 'Luck',    icon: '🎲' },
]

export default function MobileNav() {
  const pathname = usePathname()

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-s-bg2 border-t border-s-border z-50">
      <div className="flex">
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
                'flex-1 flex flex-col items-center justify-center py-2 gap-[3px]',
                'text-[9px] font-bold tracking-[0.5px] uppercase transition-colors duration-150',
                isActive ? 'text-s-gold' : 'text-s-text3',
              ].join(' ')}
            >
              <span className="text-[18px] leading-none">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
