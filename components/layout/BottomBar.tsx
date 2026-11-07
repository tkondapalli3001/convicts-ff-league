'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { MoreHorizontal, User } from 'lucide-react'
import { useLeague } from '@/context/LeagueContext'
import { useMe } from '@/hooks/useMe'
import BottomSheet from '@/components/shared/BottomSheet'
import { OwnerPicker } from '@/components/shared/PickYourself'
import { CURRENT_SEASON } from '@/lib/league'
import { NAV_ITEMS } from './nav-items'

const BAR_HREFS = ['/', `/${CURRENT_SEASON}`, '/owners']
const BAR = NAV_ITEMS.filter(i => BAR_HREFS.includes(i.href))
const MORE = NAV_ITEMS.filter(i => !BAR_HREFS.includes(i.href))
const CELL = 'flex min-h-[52px] flex-1 flex-col items-center justify-center gap-1 text-[9px] font-bold uppercase tracking-[1.5px] transition-colors'

type Sheet = 'more' | 'pick'

/**
 * Phone navigation: Home · season · Me · Owners · More, in thumb reach. Wider
 * screens use the navbar. The sheet is portaled, like every overlay. Its links
 * replace the history entry the sheet added, so Back doesn't stop on a closed
 * sheet.
 */
export default function BottomBar() {
  const pathname = usePathname()
  const router = useRouter()
  const { me } = useMe()
  const [sheet, setSheet] = useState<Sheet | null>(null)
  const [goToMeOnPick, setGoToMeOnPick] = useState(false)

  useEffect(() => { setSheet(null) }, [pathname])

  const mePath = me ? `/owners/${encodeURIComponent(me)}` : null
  const onMe = !!mePath && decodeURIComponent(pathname).startsWith(`/owners/${me}`)
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href) && !(href === '/owners' && onMe))
  const inMore = MORE.some(i => pathname.startsWith(i.href))
  const color = (active: boolean) => (active ? 'text-gold-soft' : 'text-s-text3')

  const [home, season, owners] = BAR

  const barLink = (item: (typeof BAR)[number]) => {
    const Icon = item.icon
    return (
      <Link key={item.href} href={item.href} className={`${CELL} ${color(isActive(item.href))}`} aria-current={isActive(item.href) ? 'page' : undefined}>
        <Icon size={18} aria-hidden />
        {item.label}
      </Link>
    )
  }

  return (
    <>
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 flex border-t sm:hidden"
        style={{ background: '#070708', borderColor: 'rgba(var(--gold-rgb), 0.16)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {barLink(home)}
        {barLink(season)}
        {mePath ? (
          <Link href={mePath} className={`${CELL} ${color(onMe)}`} aria-current={onMe ? 'page' : undefined}>
            <User size={18} aria-hidden />
            Me
          </Link>
        ) : (
          <button type="button" onClick={() => { setGoToMeOnPick(true); setSheet('pick') }} className={`${CELL} ${color(false)}`}>
            <User size={18} aria-hidden />
            Me
          </button>
        )}
        {barLink(owners)}
        <button type="button" onClick={() => { setGoToMeOnPick(false); setSheet('more') }} className={`${CELL} ${color(inMore)}`} aria-haspopup="dialog">
          <MoreHorizontal size={18} aria-hidden />
          More
        </button>
      </nav>

      {sheet && (
        <BarSheet
          mode={sheet}
          me={me || null}
          onChangeMe={() => setSheet('pick')}
          onClose={() => setSheet(null)}
          onPicked={owner => {
            if (!goToMeOnPick) setSheet('more')
            // Already there, nothing navigates, so close the sheet here
            else if (decodeURIComponent(pathname).startsWith(`/owners/${owner}`)) setSheet(null)
            else router.replace(`/owners/${encodeURIComponent(owner)}`)
          }}
        />
      )}
    </>
  )
}

function BarSheet({ mode, me, onChangeMe, onClose, onPicked }: {
  mode: Sheet
  me: string | null
  onChangeMe: () => void
  onClose: () => void
  onPicked: (owner: string) => void
}) {
  const pathname = usePathname()
  const { state } = useLeague()

  const { loaded, years, loadingText } = state
  const statusText = loaded && years.length > 0 ? `${years[0]}–${years[years.length - 1]} · ${years.length} seasons` : loadingText

  return (
    <BottomSheet title={mode === 'pick' ? 'Which one are you?' : 'More'} onClose={onClose}>
        {mode === 'pick' ? (
          <div className="p-4">
            <p className="mb-4 text-[12px] leading-snug text-s-text2">Your matchup comes first from here on. It’s only remembered on this device.</p>
            <OwnerPicker onPicked={onPicked} />
          </div>
        ) : (
          <>
            <div className="px-3 py-2">
              {MORE.map(item => {
                const Icon = item.icon
                const active = pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    replace
                    className={`flex min-h-[48px] items-center gap-3 rounded-[2px] px-3 text-[11px] font-bold uppercase tracking-[2px] ${active ? 'text-gold-soft' : 'text-s-text2'}`}
                    style={active ? { background: 'rgba(var(--gold2-rgb), 0.08)' } : undefined}
                  >
                    <Icon size={16} aria-hidden />
                    {item.label}
                  </Link>
                )
              })}
            </div>
            <div className="flex items-center justify-between gap-3 border-t px-5 py-2" style={{ borderColor: 'rgba(var(--gold-rgb), 0.10)' }}>
              <span className="text-[9px] font-semibold uppercase tracking-[2px] text-s-text3">{statusText}</span>
              <button type="button" onClick={onChangeMe} className="min-h-[36px] flex-shrink-0 text-[10px] font-bold uppercase tracking-[1.5px] text-gold-soft">
                {me ? `You: ${me} · Change` : 'Pick who you are'}
              </button>
            </div>
          </>
        )}
    </BottomSheet>
  )
}
