'use client'

import { useState, useEffect, useMemo } from 'react'
import { useLeague } from '@/context/LeagueContext'
import { getPlayersCache, type PlayerMetadata } from '@/lib/players-cache'
import { computePlayerWinRates, computeDraftOwnership, computeDraftStructure, computePlayerScores } from '@/lib/data-processing'
import type { OwnershipEntry, DraftStructureEntry, PlayerScoreStat } from '@/lib/data-processing'
import type { PlayerStat, DraftPick } from '@/types'

interface PlayersData {
  playerWinRates: PlayerStat[]
  ownership: OwnershipEntry[]
  draftStructure: DraftStructureEntry[]
  playerScores: PlayerScoreStat[]
  loading: boolean
  loadingText: string
  error: string | null
}

export function usePlayersData(enabled: boolean = true): PlayersData {
  const { state } = useLeague()
  const [playersCache, setPlayersCache] = useState<Record<string, PlayerMetadata> | null>(null)
  const [loading, setLoading] = useState(true)
  const loadingText = 'Loading player names…'
  const [error, setError] = useState<string | null>(null)

  // Draft picks are already in LeagueState (snapshot or live) — no refetching
  const draftPicksByYear = useMemo<Record<number, DraftPick[]> | null>(() => {
    if (!state.loaded) return null
    const result: Record<number, DraftPick[]> = {}
    for (const [year, { picks }] of Object.entries(state.draftData)) {
      if (picks.length) result[Number(year)] = picks
    }
    return result
  }, [state])

  useEffect(() => {
    if (!enabled || !state.loaded) return

    let cancelled = false

    ;(async () => {
      try {
        const cache = await getPlayersCache()
        if (cancelled) return
        setPlayersCache(cache)
        setLoading(false)
      } catch (err) {
        if (!cancelled) {
          setError((err as Error).message)
          setLoading(false)
        }
      }
    })()

    return () => { cancelled = true }
  }, [enabled, state.loaded])

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

  const playerScores = useMemo(() => {
    if (!state.loaded || !playersCache) return []
    return computePlayerScores(state, playersCache)
  }, [state, playersCache])

  return { playerWinRates, ownership, draftStructure, playerScores, loading, loadingText, error }
}
