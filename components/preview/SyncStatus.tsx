'use client'

import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { timeAgo } from '@/lib/utils'

/**
 * Live-sync readout for the 2026 tab: a status dot, what's being shown, how
 * fresh it is, and a manual sync button. Brick dot + "offline" when the last
 * sync failed and the page is showing the previous data.
 */
export default function SyncStatus({ label, syncedAt, syncing, stale, onRefresh }: {
  label: string
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

  const freshness = syncedAt == null
    ? 'Syncing with Sleeper…'
    : stale
      ? `Offline · data from ${timeAgo(now - syncedAt)}`
      : `Synced ${timeAgo(now - syncedAt)}`

  return (
    <div className="mb-4 flex items-center justify-end gap-2 text-[10px] font-semibold uppercase tracking-[1.5px] text-s-text3">
      <span
        className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${stale ? '' : 'animate-gold-pulse'}`}
        style={{ background: stale ? '#B4636B' : '#7FA886' }}
        aria-hidden
      />
      <span className="truncate">
        <span className="text-s-text2">{label}</span> · {freshness}
      </span>
      <button
        onClick={onRefresh}
        disabled={syncing}
        className="flex-shrink-0 rounded-full p-1.5 transition-colors hover:text-gold-soft disabled:opacity-60"
        aria-label="Sync with Sleeper now"
        title="Sync now"
      >
        <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
      </button>
    </div>
  )
}
