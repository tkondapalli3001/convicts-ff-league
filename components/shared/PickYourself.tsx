'use client'

import { useMemo } from 'react'
import { useLeague } from '@/context/LeagueContext'
import { useMe } from '@/hooks/useMe'
import { useBelowLg } from '@/hooks/useBelowLg'
import { INACTIVE_OWNERS, USER_ID_TO_OWNER } from '@/lib/league'
import OwnerAvatar from '@/components/shared/OwnerAvatar'
import BottomSheet from '@/components/shared/BottomSheet'

/** The owners someone can be: this league's active managers, A–Z. */
function useActiveOwners(): string[] {
  const { state } = useLeague()
  return useMemo(() => {
    const seasons = Object.keys(state.rosterUserMaps).map(Number)
    const latest = seasons.length ? state.rosterUserMaps[Math.max(...seasons)] : null
    const names = Object.values(latest ?? USER_ID_TO_OWNER)
    return [...new Set(names)].filter(n => !INACTIVE_OWNERS.has(n)).sort()
  }, [state.rosterUserMaps])
}

/** A grid of the league's owners; tapping one makes you them. */
export function OwnerPicker({ onPicked }: { onPicked?: (owner: string) => void }) {
  const owners = useActiveOwners()
  const { me, setMe } = useMe()
  return (
    <div className="grid grid-cols-5 gap-x-1 gap-y-3">
      {owners.map(owner => (
        <button
          key={owner}
          type="button"
          onClick={() => { setMe(owner); onPicked?.(owner) }}
          aria-pressed={me === owner}
          className="flex min-h-[64px] min-w-0 flex-col items-center gap-1.5 rounded-[2px] py-1 transition-colors hover:bg-[rgba(var(--gold2-rgb),0.05)]"
        >
          <OwnerAvatar name={owner} size="md" />
          <span className={`w-full truncate text-center text-[10px] font-semibold ${me === owner ? 'text-gold-soft' : 'text-s-text2'}`}>{owner}</span>
        </button>
      ))}
    </div>
  )
}

/**
 * The one-time ask: a sheet the first time someone lands on Home or the season
 * tab, wherever the bottom bar is the navigation. Picking, "Not now", Back or
 * a tap outside all answer it for good; "Me" in the bottom bar asks again.
 */
export function PickYourselfSheet() {
  const { state } = useLeague()
  const { me, setMe } = useMe()
  const below = useBelowLg()
  if (me !== null || !below || !state.loaded) return null
  return (
    <BottomSheet title="Which one are you?" onClose={() => setMe('')}>
      <div className="p-4">
        <p className="mb-4 text-[12px] leading-snug text-s-text2">Your matchup comes first from here on. It’s only remembered on this device.</p>
        <OwnerPicker />
        <button
          type="button"
          onClick={() => setMe('')}
          className="mt-4 min-h-[44px] w-full rounded-[2px] border text-[10px] font-bold uppercase tracking-[2px] text-s-text2 transition-colors hover:text-gold-soft"
          style={{ borderColor: 'rgba(var(--gold-rgb), 0.18)' }}
        >
          Not now
        </button>
      </div>
    </BottomSheet>
  )
}
