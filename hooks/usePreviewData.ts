'use client'

import { useState, useEffect, useMemo } from 'react'
import { useLeague } from '@/context/LeagueContext'
import { computeLuckIndex } from '@/lib/luck'
import {
  getPreviewSeason, getSeasonWeeks, getDefaultWeek,
  buildWeekPreviews, computeStandings, computeImplication,
  smackLines, loadWeekProjections, projectTeam, startersByRoster,
} from '@/lib/preview'
import type { MatchupPreview, Implication } from '@/lib/preview'

export interface EnrichedPreview extends MatchupPreview {
  smack: string[]
  implicationA: Implication | null
  implicationB: Implication | null
  projA: number | null
  projB: number | null
}

export interface PreviewData {
  season: number | null
  weeks: number[]
  week: number
  previews: EnrichedPreview[]
  /** True while the projections fetch is still in flight. */
  projectionsLoading: boolean
}

/** Data for the This Week page. `selectedWeek` null = the default week. */
export function usePreviewData(selectedWeek: number | null): PreviewData {
  const { state } = useLeague()

  const season = useMemo(() => (state.loaded ? getPreviewSeason(state) : null), [state])
  const weeks = useMemo(() => (season ? getSeasonWeeks(state, season) : []), [state, season])
  const defaultWeek = useMemo(() => (season ? getDefaultWeek(state, season) : 1), [state, season])
  const week = selectedWeek ?? defaultWeek

  const luck = useMemo(() => {
    if (!season) return {}
    const entries = computeLuckIndex(state.matchups, state.rosterUserMaps, state.ownerSeasons, season)
    return Object.fromEntries(entries.map(e => [e.owner, e.luckIndex]))
  }, [state, season])

  // Projections are the one live fetch on this page — undocumented endpoint,
  // so the UI must render fully without them.
  const [projections, setProjections] = useState<Record<string, number> | null>(null)
  const [projectionsLoading, setProjectionsLoading] = useState(false)
  useEffect(() => {
    if (!season) return
    let cancelled = false
    setProjectionsLoading(true)
    loadWeekProjections(state, season, week).then(p => {
      if (cancelled) return
      setProjections(p)
      setProjectionsLoading(false)
    })
    return () => { cancelled = true }
  }, [state, season, week])

  const previews = useMemo<EnrichedPreview[]>(() => {
    if (!season) return []
    const base = buildWeekPreviews(state, season, week)
    const priorGames = state.allMatchups.filter(m => m.year === season && m.week < week)
    const standings = computeStandings(priorGames)
    const starters = startersByRoster(state, season, week)
    const settings = state.leagues[season]?.settings as { playoff_teams?: number } | undefined
    const playoffSpots = settings?.playoff_teams ?? 6

    return base.map(p => ({
      ...p,
      smack: smackLines({ year: season, week, teamA: p.teamA, teamB: p.teamB, h2h: p.h2h, luck }),
      implicationA: p.isPlayoff ? null : computeImplication(standings, p.teamA.name, playoffSpots),
      implicationB: p.isPlayoff ? null : computeImplication(standings, p.teamB.name, playoffSpots),
      projA: projectTeam(starters[p.teamA.rosterId], projections),
      projB: projectTeam(starters[p.teamB.rosterId], projections),
    }))
  }, [state, season, week, luck, projections])

  return { season, weeks, week, previews, projectionsLoading }
}
