'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { SLEEPER_API, LEAGUE_ID } from '@/lib/league'
import { sleepFetch, fetchUsers, fetchRosters, fetchMatchupsForWeek, fetchWinnersBracket, fetchLosersBracket, fetchDrafts, fetchDraftPicks, loadAllSnapshotSeasons } from '@/lib/sources'
import { ownerAvatars, rosterOwnerMap, buildFlatMatchups, buildOwnerSeasons, isSeasonComplete, playoffStartWeek } from '@/lib/data-processing'
import type { LeagueState, LeagueChainEntry, SleeperLeague, SleeperMatchup, SleeperUser, SleeperRoster, BracketGame, SleeperDraft } from '@/types'

// ─── Initial State ─────────────────────────────────────────────────────────────

const initialState: LeagueState = {
  leagues: {},
  users: {},
  rosters: {},
  rosterUserMaps: {},
  matchups: {},
  brackets: {},
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
      // The newest league is asked for at once, alongside the snapshot files
      // rather than after them: it's needed either way, and it's a round trip saved.
      const head: Promise<{ lg: SleeperLeague } | { err: unknown }> =
        sleepFetch<SleeperLeague>(`${SLEEPER_API}/league/${LEAGUE_ID}`).then(lg => ({ lg }), (err: unknown) => ({ err }))

      const snapshots = await loadAllSnapshotSeasons()
      const snapshotById = new Map(snapshots.map(s => [s.league.league_id, s]))

      // Walk the live chain from LEAGUE_ID, stopping once it reaches a
      // snapshotted league — history from that point back is already local.
      setLoadingText('Connecting to Sleeper...')
      const liveEntries: LeagueChainEntry[] = []
      let lid: string | null = LEAGUE_ID
      while (lid && lid !== '0' && !snapshotById.has(lid)) {
        try {
          let lg: SleeperLeague
          if (lid === LEAGUE_ID) {
            const first = await head
            if ('err' in first) throw first.err
            lg = first.lg
          } else {
            lg = await sleepFetch<SleeperLeague>(`${SLEEPER_API}/league/${lid}`)
          }
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
      const draftData: LeagueState['draftData'] = {}

      for (const { id, year, data } of chain) {
        leagues[year] = data
        const snap = snapshotById.get(id)
        setLoadingText(snap ? `Restoring ${year} season...` : `Loading ${year} season...`)

        // Week count — same logic for both sources
        const lgStatus = data.status || 'complete'
        const regWeeks = playoffStartWeek(data)
        let totalWeeks = 0
        if (lgStatus !== 'pre_draft' && lgStatus !== 'drafting') {
          totalWeeks = data.settings?.leg > 0 ? data.settings.leg : 17
        }

        // A live season's pieces are asked for together: one round trip, where
        // it used to be three (people, then weeks, then brackets and drafts).
        let fetchedUsers: SleeperUser[], fetchedRosters: SleeperRoster[]
        let live: { weeks: SleeperMatchup[][]; winners: BracketGame[]; losers: BracketGame[]; drafts: SleeperDraft[] } | null = null
        if (snap) {
          fetchedUsers = snap.users
          fetchedRosters = snap.rosters
        } else {
          const weekNumbers = Array.from({ length: totalWeeks }, (_, i) => i + 1)
          const [u, r, weeks, winners, losers, drafts] = await Promise.all([
            fetchUsers(id),
            fetchRosters(id),
            Promise.all(weekNumbers.map(week => fetchMatchupsForWeek(id, week).catch(() => [] as SleeperMatchup[]))),
            fetchWinnersBracket(id).catch(() => [] as BracketGame[]),
            fetchLosersBracket(id).catch(() => [] as BracketGame[]),
            fetchDrafts(id).catch(() => [] as SleeperDraft[]),
          ])
          fetchedUsers = u
          fetchedRosters = r
          live = { weeks, winners, losers, drafts }
        }
        users[year] = fetchedUsers
        rosters[year] = fetchedRosters

        rosterUserMaps[year] = rosterOwnerMap(fetchedUsers, fetchedRosters)

        matchups[year] = {}
        if (snap) {
          for (const [w, m] of Object.entries(snap.matchupsByWeek)) {
            const week = Number(w)
            matchups[year][week] = { matchups: m as SleeperMatchup[], isPlayoff: week >= regWeeks }
          }
        } else if (live) {
          live.weeks.forEach((m, i) => { matchups[year][i + 1] = { matchups: m, isPlayoff: i + 1 >= regWeeks } })
        }

        // Brackets + draft
        if (snap) {
          brackets[year] = { winners: snap.winnersBracket, losers: snap.losersBracket }
          if (snap.draft) draftData[year] = snap.draft
        } else if (live) {
          const { winners, losers, drafts } = live
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

      // A season joins `years` (which drives every historical stats surface)
      // only once Sleeper marks it complete — no records, byes, or accolades
      // from a season still in progress. The live season stays in
      // leagueChain/leagues/matchups so live features (the season tab, draft
      // countdown) keep working.
      const completedYears = years.filter(y => isSeasonComplete(leagues[y]))
      // Each owner's latest picture (chain is oldest → newest)
      const ownerAvatarMap = ownerAvatars(chain.map(c => users[c.year]))

      // Build derived data
      const partialState: LeagueState = {
        ...initialState,
        leagues,
        users,
        rosters,
        rosterUserMaps,
        matchups,
        brackets,
        ownerAvatarMap,
        ownerSeasons: {},
        allMatchups: [],
        leagueChain: chain,
        draftData,
        years: completedYears,
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
        loadingText: `${completedYears[0]}–${completedYears[completedYears.length - 1]} · ${completedYears.length} seasons`,
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
