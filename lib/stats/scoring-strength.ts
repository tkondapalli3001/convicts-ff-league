// Scoring strength: how far above the league's weekly average each owner
// scores, with how sure that average can be. Points for is the one stat in
// this league that carries from one season to the next (data/
// stat_repeatability.csv), so it gets a chart of its own.

import type { Matchup } from '@/types'
import { excludeManualGames } from './game-filters'

export interface ScoringStrength {
  owner: string
  games: number
  /** Points per game above (or below) that week's league average. */
  avg: number
  /** 95% range for that average. */
  low: number
  high: number
}

/**
 * Regular-season games only, every season. Each score is compared with the
 * average of every team that played that week, so a high-scoring season
 * doesn't flatter everyone in it.
 */
export function scoringStrength(matchups: Matchup[]): ScoringStrength[] {
  const weeks = new Map<string, { owner: string; pts: number }[]>()
  for (const g of excludeManualGames(matchups)) {
    if (g.type !== 'R') continue
    const key = `${g.year}-${g.week}`
    const week = weeks.get(key) ?? weeks.set(key, []).get(key)!
    week.push({ owner: g.team1, pts: g.pts1 }, { owner: g.team2, pts: g.pts2 })
  }

  const diffs = new Map<string, number[]>()
  for (const week of weeks.values()) {
    const avg = week.reduce((a, t) => a + t.pts, 0) / week.length
    for (const t of week) (diffs.get(t.owner) ?? diffs.set(t.owner, []).get(t.owner)!).push(t.pts - avg)
  }

  return [...diffs.entries()].map(([owner, d]) => {
    const n = d.length
    const avg = d.reduce((a, b) => a + b, 0) / n
    const sd = n > 1 ? Math.sqrt(d.reduce((a, b) => a + (b - avg) ** 2, 0) / (n - 1)) : 0
    const half = 1.96 * sd / Math.sqrt(n)
    return { owner, games: n, avg, low: avg - half, high: avg + half }
  }).sort((a, b) => b.avg - a.avg)
}
