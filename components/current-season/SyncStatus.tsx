'use client'

import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { timeAgo } from '@/lib/utils'

/**
 * Live-sync readout at the end of the season tab's kicker line: a status dot,
 * how fresh the data is, and a manual sync button. The kicker says which week
 * and where it stands. Brick dot + "offline" when the last sync failed and the
 * page is showing the previous data.
 */
export default function SyncStatus({ syncedAt, syncing, stale, onRefresh }: {
  syncedAt: number | null
  syncing: boolean
  stale: boolean
  onRefresh: () => void
}) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 5000)
    return () => clearInterval(id)
  }, [])

  const ago = syncedAt == null ? null : timeAgo(now - syncedAt)

  return (
    <span className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[1px] text-s-text3 sm:gap-2 sm:text-[10px] sm:tracking-[1.5px]">
      <span
        className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${stale ? '' : 'animate-gold-pulse'}`}
        style={{ background: stale ? '#BC6C74' : '#7FA886' }}
        aria-hidden
      />
      {/* Phones show just the age ("12s ago"); the word is still read out */}
      <span className="whitespace-nowrap">
        {ago == null ? 'Syncing…' : stale ? <>Offline<span className="sr-only sm:not-sr-only"> · {ago}</span></> : <><span className="sr-only sm:not-sr-only">Synced </span>{ago}</>}
      </span>
      <button
        onClick={onRefresh}
        disabled={syncing}
        className="-my-2 -mr-2 flex-shrink-0 rounded-full p-2 transition-colors hover:text-gold-soft disabled:opacity-60"
        aria-label="Sync with Sleeper now"
        title="Sync now"
      >
        <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
      </button>
    </span>
  )
}
