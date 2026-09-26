'use client'

import { useMemo } from 'react'
import { computeLuckIndex } from '@/lib/stats'
import { flattenSeasonMatchups } from '@/lib/data-processing'
import {
  getSeasonWeeks, buildWeekPreviews, computeStandings, computeImplication,
  smackLines, projectTeam, startersByRoster, lastFinalWeek,
} from '@/lib/preview'
import type { MatchupPreview, Implication } from '@/lib/preview'
import type { LiveSeason } from '@/hooks/useLiveSeason'

export interface EnrichedPreview extends MatchupPreview {
  smack: string[]
  implicationA: Implication | null
  implicationB: Implication | null
  projA: number | null
  projB: number | null
}

export interface PreviewData {
  weeks: number[]
  week: number
  previews: EnrichedPreview[]
}

/** Matchups tab of the 2026 page. `selectedWeek` null = the current week. */
export function usePreviewData(live: LiveSeason, selectedWeek: number | null): PreviewData {
  const { state, season, projections } = live

  const weeks = useMemo(() => (season ? getSeasonWeeks(state, season) : []), [state, season])
  const week = selectedWeek ?? live.week

  // Season luck from final weeks only — a Thursday game's partial scores
  // would otherwise skew the all-play math for the whole week
  const luck = useMemo(() => {
    if (!season) return {}
    const lastFinal = lastFinalWeek(state, season)
    const finalWeeks = Object.fromEntries(
      Object.entries(state.matchups[season] ?? {}).filter(([w]) => Number(w) <= lastFinal)
    )
    const entries = computeLuckIndex({ [season]: finalWeeks }, state.rosterUserMaps, season)
    return Object.fromEntries(entries.map(e => [e.owner, e.luckIndex]))
  }, [state, season])

  const previews = useMemo<EnrichedPreview[]>(() => {
    if (!season) return []
    const base = buildWeekPreviews(state, season, week)
    // The preview season is usually live and absent from allMatchups
    // (completed seasons only) — flatten it from the raw weekly data
    const lastFinal = lastFinalWeek(state, season)
    const priorGames = flattenSeasonMatchups(state, season).filter(m => m.week < week && m.week <= lastFinal)
    const standings = computeStandings(priorGames)
    const starters = startersByRoster(state, season, week)
    const playoffSpots = state.leagues[season]?.settings?.playoff_teams ?? 6
    // Projections cover the current week only
    const proj = week === live.week ? projections : null

    return base.map(p => ({
      ...p,
      smack: smackLines({ year: season, week, teamA: p.teamA, teamB: p.teamB, h2h: p.h2h, luck }),
      implicationA: p.isPlayoff ? null : computeImplication(standings, p.teamA.name, playoffSpots),
      implicationB: p.isPlayoff ? null : computeImplication(standings, p.teamB.name, playoffSpots),
      projA: projectTeam(starters[p.teamA.rosterId], proj),
      projB: projectTeam(starters[p.teamB.rosterId], proj),
    }))
  }, [state, season, week, live.week, luck, projections])

  return { weeks, week, previews }
}
