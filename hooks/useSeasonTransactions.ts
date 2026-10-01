'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { fetchTransactions } from '@/lib/sleeper-api'
import { loadPlayerMeta, loadPlayerMetaFromIndex, playerLookup } from '@/lib/preview'
import type { ProjectedPlayer } from '@/lib/preview'
import { enrichTransaction, type EnrichedTransaction } from '@/hooks/useTransactionsData'
import type { LiveSeason } from '@/hooks/useLiveSeason'
import type { Transaction } from '@/types'

/** Above this many unknown players, skip one-off lookups and use the player index. */
const MAX_LOOKUPS = 60

export interface SeasonTransactions {
  /** Every completed move this season, newest first. */
  transactions: EnrichedTransaction[]
  /** The season's managers, A–Z. */
  owners: string[]
  loading: boolean
  /** Weeks Sleeper didn't answer for — their moves are missing until the next visit. */
  failedWeeks: number[]
}

interface Fetched {
  key: string
  byWeek: Record<number, Transaction[]>
  failed: number[]
}

/**
 * 2026 → Transactions. Past weeks load once, when the tab first opens; the
 * current week rides the live sync (useLiveSeason re-reads it every five
 * minutes), so new moves appear without a reload.
 */
export function useSeasonTransactions(live: LiveSeason, enabled: boolean): SeasonTransactions {
  const { state, season, projections, extraPlayers } = live
  const leagueId = season ? state.leagueChain.find(e => e.year === season)?.id : undefined
  const leg = season ? state.leagues[season]?.settings?.leg ?? 0 : 0
  const key = leagueId && leg ? `${leagueId}:${leg}` : ''

  const [fetched, setFetched] = useState<Fetched | null>(null)
  const [names, setNames] = useState<Record<string, ProjectedPlayer>>({})
  const requested = useRef(new Set<string>())

  useEffect(() => {
    if (!enabled || !key || !leagueId || fetched?.key === key) return
    let cancelled = false
    // Through next week: waivers that run after this week's games are filed there
    const weeks = Array.from({ length: leg + 1 }, (_, i) => i + 1)
    Promise.all(weeks.map(w =>
      fetchTransactions(leagueId, w).then(txs => [w, txs, false] as const).catch(() => [w, [] as Transaction[], true] as const)
    )).then(rows => {
      if (cancelled) return
      setFetched({
        key,
        byWeek: Object.fromEntries(rows.map(([w, txs]) => [w, txs])),
        failed: rows.filter(([, , failed]) => failed).map(([w]) => w),
      })
    })
    return () => { cancelled = true }
  }, [enabled, key, leagueId, leg, fetched?.key])

  const raw = useMemo(() => {
    const byWeek = { ...(fetched?.byWeek ?? {}) }
    // The live sync's copy of the current week is the freshest
    if (live.transactions.length) byWeek[leg] = live.transactions
    const seen = new Set<string>()
    const out: Transaction[] = []
    for (const txs of Object.values(byWeek)) {
      for (const tx of txs) {
        if (tx.status !== 'complete' || seen.has(tx.transaction_id)) continue
        seen.add(tx.transaction_id)
        out.push(tx)
      }
    }
    return out
  }, [fetched, live.transactions, leg])

  const lookup = useMemo(
    () => (season ? playerLookup(state, season, projections, extraPlayers) : null),
    [state, season, projections, extraPlayers],
  )

  // Players the live lookup can't name (long-gone drops): ask Sleeper once each
  useEffect(() => {
    if (!lookup) return
    const missing = [...new Set(raw.flatMap(t => [...Object.keys(t.adds ?? {}), ...Object.keys(t.drops ?? {})]))]
      .filter(id => lookup(id).name.startsWith('#') && !requested.current.has(id))
    if (!missing.length) return
    missing.forEach(id => requested.current.add(id))
    ;(missing.length <= MAX_LOOKUPS ? loadPlayerMeta(missing) : Promise.resolve({} as Record<string, ProjectedPlayer>))
      .then(async found => {
        // Whatever Sleeper can't name, the site's player index might
        const rest = missing.filter(id => !found[id])
        return rest.length ? { ...(await loadPlayerMetaFromIndex(rest)), ...found } : found
      })
      .then(found => { if (Object.keys(found).length) setNames(prev => ({ ...prev, ...found })) })
      .catch(() => {})
  }, [raw, lookup])

  const transactions = useMemo(() => {
    if (!season || !lookup) return []
    const rMap = state.rosterUserMaps[season] ?? {}
    const name = (id: string) => (names[id] ?? lookup(id)).name
    return raw
      .map(tx => enrichTransaction(tx, season, rMap, name))
      .sort((a, b) => b.created - a.created) // the date the table shows
  }, [raw, season, lookup, names, state.rosterUserMaps])

  const owners = useMemo(
    () => (season ? [...new Set(Object.values(state.rosterUserMaps[season] ?? {}))].sort() : []),
    [state.rosterUserMaps, season],
  )

  return {
    transactions,
    owners,
    loading: enabled && !!key && fetched?.key !== key,
    failedWeeks: fetched?.failed ?? [],
  }
}
