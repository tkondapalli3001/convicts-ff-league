'use client'

import { useEffect, useMemo, useState } from 'react'
import { flattenSeasonMatchups } from '@/lib/data-processing'
import { seasonRanks, type PowerRankingRow } from '@/lib/stats'
import {
  playerLookup, buildTeamRosters, weekStatus, getSeasonWeeks, loadWeekProjections, loadSeasonStats, ownerSchedule,
} from '@/lib/preview'
import type { TeamRoster, WeekStatus, WeekProjections, SeasonStats, PlayerSeason, ScheduleRow } from '@/lib/preview'
import type { LiveSeason } from '@/hooks/useLiveSeason'
import { useSeasonSchedule } from '@/hooks/useSeasonSchedule'

/** A team's season line for the Rosters header: name · PR · record · all-play · PF · PA. */
export interface OwnerHeader {
  /** Sleeper team name, when the manager set one. */
  teamName: string | null
  powerRank: number | null
  wins: number
  losses: number
  ties: number
  allPlay: { wins: number; losses: number; ties: number; rank: number } | null
  pf: { value: number; rank: number } | null
  pa: { value: number; rank: number } | null
}

export interface TeamRostersData {
  rosters: TeamRoster[]
  week: number
  /** Weeks with lineups to show. */
  weeks: number[]
  status: WeekStatus
  /** The selected week is the current one — the only week IR and taxi describe. */
  current: boolean
  /** player_id → season-to-date line under league scoring; null until (or unless) the feed loads. */
  stats: Record<string, PlayerSeason> | null
  headers: Record<string, OwnerHeader>
  schedules: Record<string, ScheduleRow[]>
}

/**
 * 2026 → Rosters: every lineup for the chosen week (the current one by
 * default), each player's season line, and each owner's season header and
 * schedule. Header numbers come from final games, like Power Rankings.
 */
export function useTeamRosters(live: LiveSeason, selectedWeek: number | null, rankings: PowerRankingRow[]): TeamRostersData {
  const { state, season, projections, extraPlayers } = live
  const week = selectedWeek ?? live.week
  const current = week === live.week
  const schedule = useSeasonSchedule(live)

  // Another week's projections load on demand; the live sync keeps the current week's
  const [otherProj, setOtherProj] = useState<{ week: number; proj: WeekProjections | null } | null>(null)
  useEffect(() => {
    if (!season || current) return
    let cancelled = false
    loadWeekProjections(state, season, week).then(proj => {
      if (!cancelled) setOtherProj(prev => (prev?.week === week && prev.proj === proj ? prev : { week, proj }))
    })
    return () => { cancelled = true }
  }, [state, season, week, current])
  const weekProj = current ? projections : otherProj?.week === week ? otherProj.proj : null

  // Season-to-date stats for every player — Sleeper refreshes the feed every 10 minutes
  const [seasonStats, setSeasonStats] = useState<SeasonStats | null>(null)
  useEffect(() => {
    if (!season) return
    let cancelled = false
    loadSeasonStats(state, season).then(s => { if (!cancelled) setSeasonStats(prev => (prev === s ? prev : s)) })
    return () => { cancelled = true }
  }, [state, season])

  const { rosters, status } = useMemo(() => {
    if (!season) return { rosters: [] as TeamRoster[], status: 'upcoming' as WeekStatus }
    const lookup = playerLookup(state, season, weekProj, { ...(seasonStats?.meta ?? {}), ...extraPlayers })
    const status = weekStatus(state, season, week)
    return { rosters: buildTeamRosters(state, season, week, status, weekProj, lookup), status }
  }, [state, season, week, weekProj, seasonStats, extraPlayers])

  const headers = useMemo(() => {
    if (!season) return {}
    const rMap = state.rosterUserMaps[season] ?? {}
    const users = new Map((state.users[season] ?? []).map(u => [u.user_id, u]))
    const ranks = seasonRanks(rankings)
    const rows = new Map(rankings.map(r => [r.name, r]))
    const out: Record<string, OwnerHeader> = {}
    for (const r of state.rosters[season] ?? []) {
      const owner = rMap[String(r.roster_id)] ?? `Team ${r.roster_id}`
      const row = rows.get(owner)
      const rank = ranks[owner]
      out[owner] = {
        teamName: users.get(r.owner_id)?.metadata?.team_name?.trim() || null,
        powerRank: row?.rank ?? null,
        wins: row?.wins ?? 0,
        losses: row?.losses ?? 0,
        ties: row?.ties ?? 0,
        allPlay: row && rank ? { wins: row.allPlayWins, losses: row.allPlayLosses, ties: row.allPlayTies, rank: rank.allPlay } : null,
        pf: row && rank ? { value: row.pf, rank: rank.pf } : null,
        pa: row && rank ? { value: row.pa, rank: rank.pa } : null,
      }
    }
    return out
  }, [state, season, rankings])

  const schedules = useMemo(() => {
    if (!season) return {}
    const games = flattenSeasonMatchups(state, season)
    const statusOf = (w: number) => weekStatus(state, season, w)
    const owners = [...new Set(Object.values(state.rosterUserMaps[season] ?? {}))]
    return Object.fromEntries(owners.map(o => [o, ownerSchedule(o, schedule, games, statusOf)]))
  }, [state, season, schedule])

  const weeks = useMemo(() => (season ? getSeasonWeeks(state, season) : []), [state, season])

  return { rosters, week, weeks, status, current, stats: seasonStats?.players ?? null, headers, schedules }
}
