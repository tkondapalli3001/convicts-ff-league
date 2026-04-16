'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { SLEEPER_API } from '@/lib/constants'
import { sleepFetch, buildLeagueChain, fetchUsers, fetchRosters, fetchMatchupsForWeek, fetchWinnersBracket, fetchLosersBracket } from '@/lib/sleeper-api'
import { resolveOwnerName, buildFlatMatchups, buildOwnerSeasons } from '@/lib/data-processing'
import type { LeagueState, SleeperUser } from '@/types'

// ─── Initial State ─────────────────────────────────────────────────────────────

const initialState: LeagueState = {
  leagues: {},
  users: {},
  rosters: {},
  rosterUserMaps: {},
  matchups: {},
  brackets: {},
  ownerMap: {},
  ownerSeasons: {},
  allMatchups: [],
  leagueChain: [],
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
      setLoadingText('Connecting to Sleeper...')

      // Pre-flight check
      try {
        await sleepFetch(`${SLEEPER_API}/state/nfl`)
      } catch (testErr) {
        if ((testErr as Error).message === 'CORS_BLOCKED') throw testErr
        console.warn('NFL state check failed, continuing anyway:', (testErr as Error).message)
      }

      setLoadingText('Loading league chain...')

      const chain = await buildLeagueChain(msg => setLoadingText(msg))

      const years = chain.map(c => c.year).sort((a, b) => a - b)

      // Accumulate state across seasons
      const leagues: LeagueState['leagues'] = {}
      const users: LeagueState['users'] = {}
      const rosters: LeagueState['rosters'] = {}
      const rosterUserMaps: LeagueState['rosterUserMaps'] = {}
      const matchups: LeagueState['matchups'] = {}
      const brackets: LeagueState['brackets'] = {}
      const ownerMap: LeagueState['ownerMap'] = {}

      for (const { id, year, data } of chain) {
        leagues[year] = data
        setLoadingText(`Loading ${year} season...`)

        const [fetchedUsers, fetchedRosters] = await Promise.all([
          fetchUsers(id),
          fetchRosters(id),
        ])
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

        // Update ownerMap
        fetchedUsers.forEach(u => {
          const name = resolveOwnerName(u.user_id, u.display_name)
          ownerMap[name] = u.user_id
        })

        // Fetch matchups
        const lgStatus = data.status || 'complete'
        const regWeeks = data.settings?.playoff_week_start > 0 ? data.settings.playoff_week_start : 15
        let totalWeeks = 0
        if (lgStatus !== 'pre_draft' && lgStatus !== 'drafting') {
          totalWeeks = data.settings?.leg > 0 ? data.settings.leg : 17
        }

        matchups[year] = {}
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

        // Fetch brackets
        const [winners, losers] = await Promise.all([
          fetchWinnersBracket(id).catch(() => []),
          fetchLosersBracket(id).catch(() => []),
        ])
        brackets[year] = { winners, losers }
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
        ownerSeasons: {},
        allMatchups: [],
        leagueChain: chain,
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
