import {
  Home, Users, Trophy, Swords,
  CalendarDays, Zap, ClipboardList,
} from 'lucide-react'

/** Single source for site navigation — used by the desktop navbar and the mobile drawer. */
export const NAV_ITEMS = [
  { href: '/',          label: 'Home',      icon: Home          },
  { href: '/this-week', label: 'This Week', icon: Swords        },
  { href: '/owners',    label: 'Owners',    icon: Users         },
  { href: '/seasons',   label: 'Seasons',   icon: CalendarDays  },
  { href: '/draft',     label: 'Draft',     icon: ClipboardList },
  { href: '/records',   label: 'Records',   icon: Trophy        },
  { href: '/players',   label: 'Players',   icon: Zap           },
]
