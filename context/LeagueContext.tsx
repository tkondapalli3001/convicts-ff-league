'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { SLEEPER_API, LEAGUE_ID } from '@/lib/constants'
import { sleepFetch, fetchUsers, fetchRosters, fetchMatchupsForWeek, fetchWinnersBracket, fetchLosersBracket, fetchDrafts, fetchDraftPicks } from '@/lib/sleeper-api'
import { loadAllSnapshotSeasons } from '@/lib/history-snapshot'
import { resolveOwnerName, buildFlatMatchups, buildOwnerSeasons } from '@/lib/data-processing'
import type { LeagueState, LeagueChainEntry, SleeperLeague, SleeperUser, SleeperMatchup } from '@/types'

// ─── Initial State ─────────────────────────────────────────────────────────────

const initialState: LeagueState = {
  leagues: {},
  users: {},
  rosters: {},
  rosterUserMaps: {},
  matchups: {},
  brackets: {},
  ownerMap: {},
  ownerAvatarMap: {},
  ownerSeasons: {},
  allMatchups: [],
  leagueChain: [],
  draftData: {},
  loaded: false,
  error: null,
  loadingText: 'Connecting to Sleeper...',
  years: [],
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface LeagueContextValue {
  state: LeagueState
}

const LeagueContext = createContext<LeagueContextValue>({ state: initialState })

export function useLeague() {
  return useContext(LeagueContext)
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function LeagueProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LeagueState>(initialState)

  function setLoadingText(text: string) {
    setState(prev => ({ ...prev, loadingText: text }))
  }

  useEffect(() => {
    loadAllData()
  }, [])

  async function loadAllData() {
    try {
      setLoadingText('Loading league history...')

      // Completed seasons ship with the site as static JSON (public/data/) —
      // instant, zero Sleeper calls. Only non-snapshotted seasons are fetched
      // live below. If the snapshot is missing entirely, everything falls
      // through to the live-fetch path unchanged.
      const snapshots = await loadAllSnapshotSeasons()
      const snapshotById = new Map(snapshots.map(s => [s.league.league_id, s]))

      // Walk the live chain from LEAGUE_ID, stopping once it reaches a
      // snapshotted league — history from that point back is already local.
      setLoadingText('Connecting to Sleeper...')
      const liveEntries: LeagueChainEntry[] = []
      let lid: string | null = LEAGUE_ID
      while (lid && lid !== '0' && !snapshotById.has(lid)) {
        try {
          const lg: SleeperLeague = await sleepFetch<SleeperLeague>(`${SLEEPER_API}/league/${lid}`)
          const yr = parseInt(lg.season)
          if (!liveEntries.find(c => c.id === lid || c.year === yr)) {
            liveEntries.push({ id: lid, year: yr, data: lg })
            setLoadingText(`Found ${yr} season...`)
          }
          lid = lg.previous_league_id
        } catch (err) {
          // Sleeper unreachable: with snapshot data in hand the site still
          // renders history; with nothing at all, surface the error.
          if (snapshots.length === 0 && liveEntries.length === 0) throw err
          break
        }
      }

      const chain: LeagueChainEntry[] = [
        ...snapshots.map(s => ({ id: s.league.league_id, year: s.year, data: s.league })),
        ...liveEntries,
      ].sort((a, b) => a.year - b.year)

      const years = chain.map(c => c.year)

      // Accumulate state across seasons
      const leagues: LeagueState['leagues'] = {}
      const users: LeagueState['users'] = {}
      const rosters: LeagueState['rosters'] = {}
      const rosterUserMaps: LeagueState['rosterUserMaps'] = {}
      const matchups: LeagueState['matchups'] = {}
      const brackets: LeagueState['brackets'] = {}
      const ownerMap: LeagueState['ownerMap'] = {}
      const ownerAvatarMap: LeagueState['ownerAvatarMap'] = {}
      const draftData: LeagueState['draftData'] = {}

      for (const { id, year, data } of chain) {
        leagues[year] = data
        const snap = snapshotById.get(id)
        setLoadingText(snap ? `Restoring ${year} season...` : `Loading ${year} season...`)

        const [fetchedUsers, fetchedRosters] = snap
          ? [snap.users, snap.rosters]
          : await Promise.all([fetchUsers(id), fetchRosters(id)])
        users[year] = fetchedUsers
        rosters[year] = fetchedRosters

        // Build roster_id → canonical owner name map
        const userMap: Record<string, SleeperUser> = {}
        fetchedUsers.forEach(u => { userMap[u.user_id] = u })

        const rMap: Record<string, string> = {}
        fetchedRosters.forEach(r => {
          const u = userMap[r.owner_id]
          rMap[String(r.roster_id)] = u
            ? resolveOwnerName(u.user_id, u.display_name)
            : `Team ${r.roster_id}`
        })
        rosterUserMaps[year] = rMap

        // Update ownerMap + ownerAvatarMap
        fetchedUsers.forEach(u => {
          const name = resolveOwnerName(u.user_id, u.display_name)
          ownerMap[name] = u.user_id
          if (u.avatar && name) {
            ownerAvatarMap[name] = `https://sleepercdn.com/avatars/${u.avatar}`
          }
        })

        // Matchups — same week-count logic for both sources
        const lgStatus = data.status || 'complete'
        const regWeeks = data.settings?.playoff_week_start > 0 ? data.settings.playoff_week_start : 15
        let totalWeeks = 0
        if (lgStatus !== 'pre_draft' && lgStatus !== 'drafting') {
          totalWeeks = data.settings?.leg > 0 ? data.settings.leg : 17
        }

        matchups[year] = {}
        if (snap) {
          for (const [w, m] of Object.entries(snap.matchupsByWeek)) {
            const week = Number(w)
            matchups[year][week] = { matchups: m as SleeperMatchup[], isPlayoff: week >= regWeeks }
          }
        } else {
          const weekPromises: Promise<void>[] = []
          for (let w = 1; w <= totalWeeks; w++) {
            const week = w
            weekPromises.push(
              fetchMatchupsForWeek(id, week)
                .then(m => { matchups[year][week] = { matchups: m, isPlayoff: week >= regWeeks } })
                .catch(() => { matchups[year][week] = { matchups: [], isPlayoff: week >= regWeeks } })
            )
          }
          await Promise.all(weekPromises)
        }

        // Brackets + draft
        if (snap) {
          brackets[year] = { winners: snap.winnersBracket, losers: snap.losersBracket }
          if (snap.draft) draftData[year] = snap.draft
        } else {
          const [winners, losers, drafts] = await Promise.all([
            fetchWinnersBracket(id).catch(() => []),
            fetchLosersBracket(id).catch(() => []),
            fetchDrafts(id).catch(() => []),
          ])
          brackets[year] = { winners, losers }

          if (drafts.length > 0) {
            const mainDraft = [...drafts].sort(
              (a, b) => (b.settings?.rounds ?? 0) - (a.settings?.rounds ?? 0)
            )[0]
            const picks = await fetchDraftPicks(mainDraft.draft_id).catch(() => [])
            draftData[year] = { draft: mainDraft, picks }
          }
        }
      }

      // Build derived data
      const partialState: LeagueState = {
        ...initialState,
        leagues,
        users,
        rosters,
        rosterUserMaps,
        matchups,
        brackets,
        ownerMap,
        ownerAvatarMap,
        ownerSeasons: {},
        allMatchups: [],
        leagueChain: chain,
        draftData,
        years,
        loaded: false,
        error: null,
        loadingText: 'Processing data...',
      }

      const allMatchups = buildFlatMatchups(partialState)
      const ownerSeasons = buildOwnerSeasons(partialState)

      setState({
        ...partialState,
        allMatchups,
        ownerSeasons,
        loaded: true,
        loadingText: `${years[0]}–${years[years.length - 1]} · ${chain.length} seasons`,
      })
    } catch (err) {
      const msg = (err as Error).message
      setState(prev => ({ ...prev, error: msg, loadingText: 'Error loading data' }))
    }
  }

  return (
    <LeagueContext.Provider value={{ state }}>
      {children}
    </LeagueContext.Provider>
  )
}
