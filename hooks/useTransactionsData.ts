'use client'

import { useState, useEffect } from 'react'
import { useLeague } from '@/context/LeagueContext'
import { fetchTransactions } from '@/lib/sleeper-api'
import { loadSnapshotTransactions, loadSnapshotManifest } from '@/lib/history-snapshot'
import { getPlayersCache, playerDisplayName } from '@/lib/players-cache'
import type { Transaction } from '@/types'

export interface EnrichedTransaction extends Transaction {
  year: number
  ownerNames: string[]
  addedPlayers: { playerId: string; name: string; owner: string }[]
  droppedPlayers: { playerId: string; name: string; owner: string }[]
}

/** A Sleeper transaction with owner and player names attached. */
export function enrichTransaction(
  tx: Transaction,
  year: number,
  rMap: Record<string, string>,
  playerName: (id: string) => string,
): EnrichedTransaction {
  const owner = (rid: number) => rMap[String(rid)] ?? `Team${rid}`
  const players = (moves: Record<string, number> | null | undefined) =>
    Object.entries(moves ?? {}).map(([pid, rid]) => ({ playerId: pid, name: playerName(pid), owner: owner(rid) }))
  return {
    ...tx,
    year,
    ownerNames: tx.roster_ids.map(owner),
    addedPlayers: players(tx.adds),
    droppedPlayers: players(tx.drops),
  }
}

// Module-level cache — persists across page visits without re-fetching
let _txCache: EnrichedTransaction[] | null = null

interface TransactionsData {
  transactions: EnrichedTransaction[]
  loading: boolean
  loadingText: string
  error: string | null
}

const WEEKS_PER_SEASON = 17

async function fetchBatch(leagueId: string, week: number): Promise<Transaction[]> {
  try {
    return await fetchTransactions(leagueId, week)
  } catch {
    return []
  }
}

/** `enabled` false defers every download until the caller actually shows transactions. */
export function useTransactionsData(enabled: boolean = true): TransactionsData {
  const { state } = useLeague()
  const [transactions, setTransactions] = useState<EnrichedTransaction[]>(_txCache ?? [])
  const [loading, setLoading] = useState(_txCache === null)
  const [loadingText, setLoadingText] = useState('Loading transactions…')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || !state.loaded || !state.leagueChain.length) return
    if (_txCache !== null) {
      setTransactions(_txCache)
      setLoading(false)
      return
    }

    let cancelled = false

    ;(async () => {
      try {
        const playersCache = await getPlayersCache()
        if (cancelled) return

        const allTxs: EnrichedTransaction[] = []
        const manifest = await loadSnapshotManifest()
        const snapshotYears = new Set(manifest?.years ?? [])

        for (const entry of state.leagueChain) {
          if (cancelled) return
          setLoadingText(`Loading ${entry.year} transactions…`)
          const rMap = state.rosterUserMaps[entry.year] ?? {}

          const enrich = (weekTxs: Transaction[]) => {
            for (const tx of weekTxs) {
              if (tx.status !== 'complete') continue
              allTxs.push(enrichTransaction(tx, entry.year, rMap, pid => playerDisplayName(playersCache[pid], pid)))
            }
          }

          // Completed seasons come from the static snapshot — no Sleeper calls
          const snapTxs = snapshotYears.has(entry.year) ? await loadSnapshotTransactions(entry.year) : null
          if (snapTxs) {
            Object.values(snapTxs).forEach(enrich)
            continue
          }

          // Live season: only weeks played so far (plus the next, where
          // waivers land) — later weeks can't have moves yet
          const leg = entry.data.status === 'complete' ? 0 : entry.data.settings?.leg ?? 0
          const weeks = leg > 0 ? Math.min(WEEKS_PER_SEASON, leg + 1) : WEEKS_PER_SEASON
          for (let batch = 1; batch <= weeks; batch += 5) {
            if (cancelled) return
            const weekNums = Array.from({ length: 5 }, (_, i) => batch + i).filter(w => w <= weeks)
            const results = await Promise.all(weekNums.map(w => fetchBatch(entry.id, w)))
            results.forEach(enrich)
          }
        }

        allTxs.sort((a, b) => b.created - a.created)
        _txCache = allTxs

        if (!cancelled) {
          setTransactions(allTxs)
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError((err as Error).message)
          setLoading(false)
        }
      }
    })()

    return () => { cancelled = true }
  }, [enabled, state.loaded, state.leagueChain.length]) // eslint-disable-line react-hooks/exhaustive-deps

  return { transactions, loading, loadingText, error }
}
