'use client'

import { useState, useEffect } from 'react'
import { useLeague } from '@/context/LeagueContext'
import { fetchTransactions } from '@/lib/sleeper-api'
import { getPlayersCache, playerDisplayName } from '@/lib/players-cache'
import type { Transaction } from '@/types'

export interface EnrichedTransaction extends Transaction {
  year: number
  ownerNames: string[]
  addedPlayers: { playerId: string; name: string; owner: string }[]
  droppedPlayers: { playerId: string; name: string; owner: string }[]
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

export function useTransactionsData(): TransactionsData {
  const { state } = useLeague()
  const [transactions, setTransactions] = useState<EnrichedTransaction[]>(_txCache ?? [])
  const [loading, setLoading] = useState(_txCache === null)
  const [loadingText, setLoadingText] = useState('Loading transactions…')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!state.loaded || !state.leagueChain.length) return
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

        for (const entry of state.leagueChain) {
          if (cancelled) return
          setLoadingText(`Loading ${entry.year} transactions…`)
          const rMap = state.rosterUserMaps[entry.year] ?? {}

          // Fetch all weeks in batches of 5
          for (let batch = 1; batch <= WEEKS_PER_SEASON; batch += 5) {
            if (cancelled) return
            const weekNums = Array.from({ length: 5 }, (_, i) => batch + i).filter(w => w <= WEEKS_PER_SEASON)
            const results = await Promise.all(weekNums.map(w => fetchBatch(entry.id, w)))

            for (const weekTxs of results) {
              for (const tx of weekTxs) {
                if (tx.status !== 'complete') continue

                const ownerNames = tx.roster_ids.map(rid => rMap[String(rid)] ?? `Team${rid}`)

                const addedPlayers = Object.entries(tx.adds ?? {}).map(([pid, rid]) => ({
                  playerId: pid,
                  name: playerDisplayName(playersCache[pid], pid),
                  owner: rMap[String(rid)] ?? `Team${rid}`,
                }))

                const droppedPlayers = Object.entries(tx.drops ?? {}).map(([pid, rid]) => ({
                  playerId: pid,
                  name: playerDisplayName(playersCache[pid], pid),
                  owner: rMap[String(rid)] ?? `Team${rid}`,
                }))

                allTxs.push({ ...tx, year: entry.year, ownerNames, addedPlayers, droppedPlayers })
              }
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
  }, [state.loaded, state.leagueChain.length]) // eslint-disable-line react-hooks/exhaustive-deps

  return { transactions, loading, loadingText, error }
}
