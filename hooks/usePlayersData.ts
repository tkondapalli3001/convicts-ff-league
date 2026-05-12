'use client'

import { useState, useEffect, useMemo } from 'react'
import { useLeague } from '@/context/LeagueContext'
import { fetchDrafts, fetchDraftPicks } from '@/lib/sleeper-api'
import { getPlayersCache, type PlayerMetadata } from '@/lib/players-cache'
import { computePlayerWinRates, computeDraftOwnership, computeDraftStructure } from '@/lib/data-processing'
import type { OwnershipEntry, DraftStructureEntry } from '@/lib/data-processing'
import type { PlayerStat, DraftPick } from '@/types'

interface PlayersData {
  playerWinRates: PlayerStat[]
  ownership: OwnershipEntry[]
  draftStructure: DraftStructureEntry[]
  loading: boolean
  loadingText: string
  error: string | null
}

export function usePlayersData(enabled: boolean = true): PlayersData {
  const { state } = useLeague()
  const [playersCache, setPlayersCache] = useState<Record<string, PlayerMetadata> | null>(null)
  const [draftPicksByYear, setDraftPicksByYear] = useState<Record<number, DraftPick[]> | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingText, setLoadingText] = useState('Loading draft data…')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || !state.loaded || !state.leagueChain.length) return

    let cancelled = false

    ;(async () => {
      try {
        setLoadingText('Loading player names…')
        const cache = await getPlayersCache()
        if (cancelled) return
        setPlayersCache(cache)

        const result: Record<number, DraftPick[]> = {}

        for (const entry of state.leagueChain) {
          if (cancelled) return
          setLoadingText(`Loading ${entry.year} draft…`)

          const drafts = await fetchDrafts(entry.id)
          const completedDraft = drafts.find(d => d.status === 'complete') ?? drafts[0]
          if (!completedDraft) continue

          const picks = await fetchDraftPicks(completedDraft.draft_id)
          result[entry.year] = picks
        }

        if (!cancelled) {
          setDraftPicksByYear(result)
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

  const playerWinRates = useMemo(() => {
    if (!state.loaded || !playersCache) return []
    return computePlayerWinRates(state, playersCache)
  }, [state, playersCache])

  const ownership = useMemo(() => {
    if (!draftPicksByYear || !playersCache) return []
    return computeDraftOwnership(draftPicksByYear, state.rosterUserMaps, playersCache)
  }, [draftPicksByYear, playersCache, state.rosterUserMaps])

  const draftStructure = useMemo(() => {
    if (!draftPicksByYear) return []
    return computeDraftStructure(draftPicksByYear, state.ownerSeasons, state.rosterUserMaps)
  }, [draftPicksByYear, state.ownerSeasons, state.rosterUserMaps])

  return { playerWinRates, ownership, draftStructure, loading, loadingText, error }
}
