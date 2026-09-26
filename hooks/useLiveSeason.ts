'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLeague } from '@/context/LeagueContext'
import {
  EMPTY_OVERLAY, liveSeasonEntry, withLiveSeason, syncLiveSeason, getPreviewSeason, getDefaultWeek,
  loadWeekProjections, loadPlayerMeta, loadPlayerMetaFromIndex, rosteredPlayerIds,
} from '@/lib/preview'
import type { LiveOverlay, WeekProjections, ProjectedPlayer } from '@/lib/preview'
import type { LeagueState, Transaction } from '@/types'

// Sleeper's CDN refreshes matchups (lineups + live points) every minute and
// the league, rosters, and transactions every five — polling any faster
// would only re-read its cache.
const POLL_MS = 60_000
const FULL_MS = 5 * 60_000
/** Above this many unknown players, skip one-off lookups (the feed is down). */
const MAX_LOOKUPS = 40

export interface LiveSeason {
  /** Global state with the live season overlaid — feed this to every 2026-tab computation. */
  state: LeagueState
  /** Season on the tab: the live one, else the latest season with games. */
  season: number | null
  /** The shown season's current week (in progress or next up), else its last week. */
  week: number
  /** True while a season is in progress and being polled. */
  live: boolean
  projections: WeekProjections | null
  /** Rostered players the projections feed doesn't cover (bye weeks). */
  extraPlayers: Record<string, ProjectedPlayer>
  /** The current week's roster moves. */
  transactions: Transaction[]
  syncedAt: number | null
  /** True while a manual refresh is in flight. */
  syncing: boolean
  /** The last sync failed — what's on screen is from the one before. */
  stale: boolean
  refresh: () => void
}

/**
 * Keeps the in-progress season current while the 2026 tab is open: re-reads
 * lineups and live scores every minute, rosters and moves every five, and
 * projections every ten — pausing while the tab is hidden and catching up the
 * moment it's visible again. The global store still loads once; this overlay
 * lives only as long as the page.
 */
export function useLiveSeason(): LiveSeason {
  const { state } = useLeague()
  const entry = useMemo(() => (state.loaded ? liveSeasonEntry(state) : null), [state])

  const [overlay, setOverlay] = useState<LiveOverlay>(EMPTY_OVERLAY)
  const [projections, setProjections] = useState<WeekProjections | null>(null)
  const [extraPlayers, setExtraPlayers] = useState<Record<string, ProjectedPlayer>>({})
  const [syncedAt, setSyncedAt] = useState<number | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [stale, setStale] = useState(false)

  // Refs let the polling loop read the latest values without re-arming
  const overlayRef = useRef(overlay)
  const lastFull = useRef(0)
  const lastSync = useRef(0)
  const inFlight = useRef(false)

  const runSync = useCallback((forceFull: boolean) => {
    if (!entry || inFlight.current) return
    inFlight.current = true
    const full = forceFull || Date.now() - lastFull.current >= FULL_MS

    syncLiveSeason(entry.id, entry.year, state, overlayRef.current, full)
      .then(async next => {
        const nextState = withLiveSeason(state, entry.year, next)
        const week = getDefaultWeek(nextState, entry.year)
        const proj = await loadWeekProjections(nextState, entry.year, week)
        // Names for everyone on a roster or in this week's moves: the feed
        // covers nearly all of them; look up the few it misses (bye weeks),
        // or fall back to the site's player index if the feed is down
        const ids = [
          ...rosteredPlayerIds(nextState, entry.year, week),
          ...next.transactions.flatMap(t => [...Object.keys(t.adds ?? {}), ...Object.keys(t.drops ?? {})]),
        ]
        let extra: Record<string, ProjectedPlayer> = {}
        if (!proj) {
          extra = await loadPlayerMetaFromIndex(ids)
        } else {
          const missing = [...new Set(ids.filter(id => !proj.players[id]))]
          if (missing.length && missing.length <= MAX_LOOKUPS) extra = await loadPlayerMeta(missing)
        }

        if (full) lastFull.current = Date.now()
        lastSync.current = Date.now()
        overlayRef.current = next
        setOverlay(next)
        setProjections(proj)
        setExtraPlayers(extra)
        setSyncedAt(lastSync.current)
        setStale(false)
      })
      .catch(() => setStale(true))
      .finally(() => {
        inFlight.current = false
        setSyncing(false)
      })
  }, [entry, state])

  useEffect(() => {
    if (!entry) return
    runSync(true)
    const timer = setInterval(() => {
      // Skip a tick that lands right after a catch-up sync from refocusing
      if (document.visibilityState === 'visible' && Date.now() - lastSync.current >= POLL_MS / 2) runSync(false)
    }, POLL_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastSync.current >= POLL_MS) runSync(false)
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [entry, runSync])

  const refresh = useCallback(() => {
    if (!entry) return
    setSyncing(true)
    runSync(true)
  }, [entry, runSync])

  const merged = useMemo(
    () => (entry ? withLiveSeason(state, entry.year, overlay) : state),
    [state, entry, overlay],
  )
  const season = useMemo(() => (merged.loaded ? getPreviewSeason(merged) : null), [merged])
  const week = useMemo(() => (season ? getDefaultWeek(merged, season) : 1), [merged, season])

  return {
    state: merged,
    season,
    week,
    live: entry != null && entry.year === season,
    projections: entry && entry.year === season ? projections : null,
    extraPlayers,
    transactions: overlay.transactions,
    syncedAt,
    syncing,
    stale,
    refresh,
  }
}
