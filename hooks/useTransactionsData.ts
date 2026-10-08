'use client'

import { useState, useEffect } from 'react'
import { useLeague } from '@/context/LeagueContext'
import { fetchTransactionWeeks, loadSnapshotTransactions, loadSnapshotManifest, getPlayersCache, playerDisplayName } from '@/lib/sources'
import { enrichTransaction, transactionWeeks } from '@/lib/data-processing'
import type { EnrichedTransaction } from '@/types'

// Module-level cache — persists across page visits without re-fetching
let _txCache: EnrichedTransaction[] | null = null

interface TransactionsData {
  transactions: EnrichedTransaction[]
  loading: boolean
  loadingText: string
  error: string | null
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

          // Completed seasons come from the static snapshot — no Sleeper calls
          const snapTxs = snapshotYears.has(entry.year) ? await loadSnapshotTransactions(entry.year) : null
          const byWeek = snapTxs ?? (await fetchTransactionWeeks(entry.id, transactionWeeks(entry.data))).byWeek
          for (const weekTxs of Object.values(byWeek)) {
            for (const tx of weekTxs) {
              if (tx.status !== 'complete') continue
              allTxs.push(enrichTransaction(tx, entry.year, rMap, pid => playerDisplayName(playersCache[pid], pid)))
            }
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
