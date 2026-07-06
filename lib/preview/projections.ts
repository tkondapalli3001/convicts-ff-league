// Projected team totals via Sleeper's projections endpoint.
//
// CAUTION: this endpoint is UNDOCUMENTED (Sleeper's public docs stop at
// league data). It works today but may change shape or disappear without
// notice — every failure path here returns null and the UI simply omits
// the projection row. Never let this module break a preview card.

import type { LeagueState, SleeperMatchup } from '@/types'

type ProjectionMap = Record<string, number>

const _cache = new Map<string, Promise<ProjectionMap | null>>()

/** Pick the points field matching the league's reception scoring. */
function pickPoints(stats: Record<string, number> | undefined, recPts: number): number | null {
  if (!stats) return null
  if (recPts >= 1 && typeof stats.pts_ppr === 'number') return stats.pts_ppr
  if (recPts >= 0.5 && typeof stats.pts_half_ppr === 'number') return stats.pts_half_ppr
  if (typeof stats.pts_std === 'number') return stats.pts_std
  return typeof stats.pts_ppr === 'number' ? stats.pts_ppr : null
}

async function fetchProjections(season: number, week: number, recPts: number): Promise<ProjectionMap | null> {
  try {
    // v1 shape: { [player_id]: { pts_ppr, pts_half_ppr, pts_std, ... } }
    const res = await fetch(`https://api.sleeper.app/v1/projections/nfl/regular/${season}/${week}`)
    if (!res.ok) return null
    const data = await res.json()
    const map: ProjectionMap = {}

    if (Array.isArray(data)) {
      // Newer shape: [{ player_id, stats: {...} }]
      for (const row of data) {
        const pts = pickPoints(row?.stats, recPts)
        if (row?.player_id && pts != null) map[row.player_id] = pts
      }
    } else if (data && typeof data === 'object') {
      for (const [pid, stats] of Object.entries(data)) {
        const pts = pickPoints(stats as Record<string, number>, recPts)
        if (pts != null) map[pid] = pts
      }
    }

    return Object.keys(map).length ? map : null
  } catch {
    return null
  }
}

/** Cached weekly projections keyed by season+week. */
export function loadWeekProjections(state: LeagueState, season: number, week: number): Promise<ProjectionMap | null> {
  // League reception scoring lives in scoring_settings, which isn't in our
  // typed subset — read it defensively.
  const league = state.leagues[season] as unknown as { scoring_settings?: { rec?: number } } | undefined
  const recPts = league?.scoring_settings?.rec ?? 0.5

  const key = `${season}|${week}|${recPts}`
  let p = _cache.get(key)
  if (!p) {
    p = fetchProjections(season, week, recPts)
    _cache.set(key, p)
  }
  return p
}

/** Sum a lineup's projected points; null when starters or projections are missing. */
export function projectTeam(starters: string[] | undefined, projections: ProjectionMap | null): number | null {
  if (!starters?.length || !projections) return null
  let total = 0
  let found = 0
  for (const pid of starters) {
    if (pid === '0' || !pid) continue // empty lineup slot
    const pts = projections[pid]
    if (typeof pts === 'number') { total += pts; found++ }
  }
  // Require most of the lineup to be projectable, or the number is misleading
  return found >= Math.max(1, Math.floor(starters.length * 0.6)) ? total : null
}

/** roster_id → starters lookup for one week, from the raw matchup data. */
export function startersByRoster(state: LeagueState, year: number, week: number): Record<number, string[]> {
  const raw: SleeperMatchup[] = state.matchups[year]?.[week]?.matchups ?? []
  const map: Record<number, string[]> = {}
  for (const m of raw) {
    if (m.starters?.length) map[m.roster_id] = m.starters
  }
  return map
}
