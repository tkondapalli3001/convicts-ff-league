'use client'

import { useMemo, useState } from 'react'
import { computeLuckIndex, buildChampPathGameKeys } from '@/lib/stats'
import { flattenSeasonMatchups } from '@/lib/data-processing'
import { localDateKey } from '@/lib/utils'
import {
  getSeasonWeeks, buildWeekPreviews, computeStandings,
  smackFacts, projectTeam, startersByRoster, lastFinalWeek, playerLookup,
  daddyOf, seasonHonors, powerRanksThrough, seasonExtremes, lineupRegrets, careerWinsBefore,
  injuryReport, weeklyMoves, matchupBadges, pickMatchupOfTheWeek,
  fitScoringModel, weekStakes,
} from '@/lib/preview'
import type {
  MatchupPreview, TeamStakes, TeamResults, Badge, DaddyStatus, PowerRankPoint, MatchupOfTheWeek,
} from '@/lib/preview'
import type { LiveSeason } from '@/hooks/useLiveSeason'
import { useSeasonSchedule } from '@/hooks/useSeasonSchedule'

export interface EnrichedPreview extends MatchupPreview {
  /** Today's group-chat ammo, in order — the modal pages through it. */
  smack: string[]
  /** Playoff odds and exact clinch/elimination conditions entering the week; null in the playoffs. */
  stakesA: TeamStakes | null
  stakesB: TeamStakes | null
  projA: number | null
  projB: number | null
  /** Set when either owner has won 75%+ of 5+ meetings. */
  daddy: DaddyStatus | null
  badgesA: Badge[]
  badgesB: Badge[]
  /** Power ranks entering the week. */
  rankA: PowerRankPoint | null
  rankB: PowerRankPoint | null
}

export interface PreviewData {
  weeks: number[]
  week: number
  previews: EnrichedPreview[]
  /** The week's featured matchup — `index` points into `previews`; `ammo` avoids its reasons' topics. */
  motw: (MatchupOfTheWeek & { ammo: string | null }) | null
}

/** Matchups tab of the 2026 page. `selectedWeek` null = the current week. */
export function usePreviewData(live: LiveSeason, selectedWeek: number | null): PreviewData {
  const { state, season, projections, extraPlayers, transactions } = live

  const weeks = useMemo(() => (season ? getSeasonWeeks(state, season) : []), [state, season])
  const week = selectedWeek ?? live.week

  // Ammo rotates daily: key it to the day of the latest sync, else the day the page opened
  const [openedOn] = useState(() => localDateKey(new Date()))
  const dayKey = live.syncedAt ? localDateKey(new Date(live.syncedAt)) : openedOn

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

  // Title-path playoff games, so a consolation meeting isn't billed as an elimination
  const champPath = useMemo(() => buildChampPathGameKeys(state), [state])

  // Every regular-season game, played or not — the playoff odds simulate them all
  const schedule = useSeasonSchedule(live)

  // How scores behave week to week, learned from completed seasons
  const history = useMemo(
    () => state.allMatchups
      .filter(m => m.type === 'R')
      .flatMap(m => [{ season: m.year, team: m.team1, pts: m.pts1 }, { season: m.year, team: m.team2, pts: m.pts2 }])
      .filter(g => g.pts > 0),
    [state.allMatchups],
  )

  const { previews, motw } = useMemo(() => {
    if (!season) return { previews: [] as EnrichedPreview[], motw: null }
    const base = buildWeekPreviews(state, season, week)

    // The preview season is usually live and absent from allMatchups
    // (completed seasons only) — flatten it from the raw weekly data
    const lastFinal = lastFinalWeek(state, season)
    const finalGames = flattenSeasonMatchups(state, season).filter(m => m.week <= lastFinal)
    const priorGames = finalGames.filter(m => m.week < week)
    const settings = state.leagues[season]?.settings
    const playoffSpots = settings?.playoff_teams ?? 6
    const playoffStart = settings?.playoff_week_start || 15

    const standings = computeStandings(priorGames)
    const stakes = !base.length || base[0].isPlayoff ? {} : (() => {
      const remaining = Object.values(schedule).flat().filter(g => g.week >= week)
      const regEnd = playoffStart - 1
      // Only with the whole remaining schedule — a partial one would understate every race
      for (let w = week; w <= regEnd; w++) if (!schedule[w]?.length) return {}
      const scores: Record<string, number[]> = {}
      for (const g of priorGames) {
        if (g.type !== 'R') continue
        ;(scores[g.team1] ??= []).push(g.pts1)
        ;(scores[g.team2] ??= []).push(g.pts2)
      }
      const names = new Set([...Object.values(state.rosterUserMaps[season] ?? {}), ...remaining.flatMap(g => [g.a, g.b])])
      const teams: TeamResults[] = [...names].map(name => {
        const row = standings.find(r => r.name === name)
        return { name, wins: row?.wins ?? 0, pf: row?.pf ?? 0, scores: scores[name] ?? [] }
      })
      const model = fitScoringModel(history, Object.values(scores).flat())
      return weekStakes({ teams, schedule: remaining, week, playoffSpots, model, seedKey: `${season}-${week}` })
    })()
    const ranks = powerRanksThrough(finalGames, Math.min(week - 1, lastFinal, playoffStart - 1))
    const { high, low } = seasonExtremes(priorGames)
    const honors = seasonHonors(state, season)
    const careerBefore = careerWinsBefore(state, season)
    const careerWins: Record<string, number> = {}
    for (const p of base) {
      for (const t of [p.teamA, p.teamB]) careerWins[t.name] = (careerBefore[t.name] ?? 0) + t.wins
    }

    // Projections, lineups, and waiver moves describe the current week only
    const rMap = state.rosterUserMaps[season] ?? {}
    const starters = startersByRoster(state, season, week)
    const current = week === live.week
    const proj = current ? projections : null
    const lookup = playerLookup(state, season, projections, extraPlayers)
    const injuries = current && base[0]?.status !== 'final' ? injuryReport(starters, rMap, lookup) : {}
    const moves = current ? weeklyMoves(transactions, rMap, lookup) : {}
    const regrets = week - 1 >= 1 && week - 1 <= lastFinal ? lineupRegrets(state, season, week - 1, lookup) : {}

    const rows = base.map(p => {
      const daddy = daddyOf(p.h2h, p.teamA.name, p.teamB.name)
      const projA = projectTeam(starters[p.teamA.rosterId], proj)
      const projB = projectTeam(starters[p.teamB.rosterId], proj)
      const badges = (team: typeof p.teamA, opponent: string) => matchupBadges({
        name: team.name,
        opponent,
        streak: team.streak,
        daddy,
        powerRank: ranks[team.name]?.rank ?? null,
        honors,
        injuries: injuries[team.name] ?? null,
      })
      const facts = smackFacts({
        year: season, week, teamA: p.teamA, teamB: p.teamB, h2h: p.h2h, luck,
        status: p.status, ptsA: p.ptsA, ptsB: p.ptsB, projA, projB, daddy, ranks, honors,
        careerWins, seasonHigh: high, seasonLow: low, regrets, injuries, moves, champPath,
      }, dayKey)
      const preview: EnrichedPreview = {
        ...p,
        stakesA: p.isPlayoff ? null : stakes[p.teamA.name] ?? null,
        stakesB: p.isPlayoff ? null : stakes[p.teamB.name] ?? null,
        projA,
        projB,
        daddy,
        badgesA: badges(p.teamA, p.teamB.name),
        badgesB: badges(p.teamB, p.teamA.name),
        rankA: ranks[p.teamA.name] ?? null,
        rankB: ranks[p.teamB.name] ?? null,
        smack: facts.map(f => f.text),
      }
      return { preview, facts }
    })

    const enriched = rows.map(r => r.preview)
    const pick = pickMatchupOfTheWeek(enriched, { week, ranks, careerWins, honors, champPath })
    const motw = pick && {
      ...pick,
      // The card's ammo line covers something its reasons don't
      ammo: rows[pick.index].facts.find(f => !pick.topics.includes(f.topic))?.text ?? null,
    }
    return { previews: enriched, motw }
  }, [state, season, week, live.week, luck, champPath, projections, extraPlayers, transactions, dayKey, schedule, history])

  return { weeks, week, previews, motw }
}
