'use client'

import { useMemo } from 'react'
import { useLeague } from '@/context/LeagueContext'
import { useMe } from '@/hooks/useMe'
import { INACTIVE_OWNERS, USER_ID_TO_OWNER } from '@/lib/league'
import OwnerAvatar from '@/components/shared/OwnerAvatar'

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

/** The one-time ask, shown until someone answers or says not now. */
export function PickYourselfPrompt({ className }: { className?: string }) {
  const { me, setMe } = useMe()
  if (me !== null) return null
  return (
    <div className={`rounded-[6px] p-4 ${className ?? ''}`} style={{ background: '#0B0B0D', border: '1px solid rgba(var(--gold-rgb), 0.20)' }}>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <div className="text-[11px] font-bold uppercase tracking-[2.5px] text-gold-soft">Which one are you?</div>
        <button type="button" onClick={() => setMe('')} className="min-h-[28px] flex-shrink-0 px-1 text-[10px] uppercase tracking-[1px] text-s-text3 hover:text-s-text2">
          Not now
        </button>
      </div>
      <p className="mb-3 text-[12px] leading-snug text-s-text2">Your matchup comes first from here on. It’s only remembered on this device.</p>
      <OwnerPicker />
    </div>
  )
}
