// Season-to-date stats for every NFL player, scored with the league's own
// settings — the 2026 Rosters table's Season Rank / GP / FPTS / PPG. One
// request covers every player; scoring Sleeper's season totals this way
// matches the points Sleeper credits rostered players to the cent.
//
// CAUTION: like the projections, this endpoint is UNDOCUMENTED. Every failure
// returns null and the table shows dashes; it never breaks the page.

import { scoreStats, type ProjectedPlayer } from './projections'
import type { LeagueState } from '@/types'

export interface PlayerSeason {
  /** Fantasy points under the league's scoring. */
  fpts: number
  /** Games played. */
  gp: number
  position: string
  /** Rank among players at the position by fpts (ties share a rank); null before a game. */
  rank: number | null
}

export interface SeasonStats {
  players: Record<string, PlayerSeason>
  /** Name/team for every player in the feed — a name fallback for any week. */
  meta: Record<string, ProjectedPlayer>
}

const POSITIONS = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF']
// Sleeper's CDN refreshes the feed every 10 minutes
const TTL_MS = 10 * 60_000
const RETRY_MS = 60_000

interface Row {
  player_id?: string
  stats?: Record<string, number>
  player?: { first_name?: string; last_name?: string; position?: string; team?: string | null; injury_status?: string | null }
}

/** Rank each position by fantasy points; players who haven't played aren't ranked. */
export function rankSeasonStats(rows: { id: string; position: string; fpts: number; gp: number }[]): Record<string, PlayerSeason> {
  const out: Record<string, PlayerSeason> = {}
  const byPos: Record<string, { id: string; fpts: number }[]> = {}
  for (const r of rows) {
    out[r.id] = { fpts: r.fpts, gp: r.gp, position: r.position, rank: null }
    if (r.gp > 0) (byPos[r.position] ??= []).push({ id: r.id, fpts: r.fpts })
  }
  for (const list of Object.values(byPos)) {
    list.sort((a, b) => b.fpts - a.fpts)
    list.forEach((p, i) => {
      out[p.id].rank = i > 0 && p.fpts === list[i - 1].fpts ? out[list[i - 1].id].rank : i + 1
    })
  }
  return out
}

async function fetchSeasonStats(season: number, scoring: Record<string, number> | undefined): Promise<SeasonStats | null> {
  if (!scoring) return null
  try {
    const qs = POSITIONS.map(p => `position[]=${p}`).join('&')
    const res = await fetch(`https://api.sleeper.com/stats/nfl/${season}?season_type=regular&${qs}`)
    if (!res.ok) return null
    const rows: unknown = await res.json()
    if (!Array.isArray(rows)) return null

    const scored: { id: string; position: string; fpts: number; gp: number }[] = []
    const meta: Record<string, ProjectedPlayer> = {}
    for (const row of rows as Row[]) {
      const id = row?.player_id
      const p = row?.player
      if (!id || !p?.position) continue
      meta[id] = {
        name: p.position === 'DEF' ? (p.last_name || id) : `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || `#${id}`,
        position: p.position,
        team: p.team ?? null,
        injury: p.injury_status || null,
      }
      const stats = row.stats ?? {}
      scored.push({ id, position: p.position, fpts: scoreStats(stats, scoring), gp: stats.gp ?? 0 })
    }
    return scored.length ? { players: rankSeasonStats(scored), meta } : null
  } catch {
    return null
  }
}

const _cache = new Map<number, { at: number; promise: Promise<SeasonStats | null>; last: SeasonStats | null }>()

/** Cached per season; refreshed at most every 10 minutes, keeping the last good copy on failure. */
export function loadSeasonStats(state: LeagueState, season: number): Promise<SeasonStats | null> {
  const hit = _cache.get(season)
  if (hit && Date.now() - hit.at < TTL_MS) return hit.promise
  const entry = { at: Date.now(), last: hit?.last ?? null, promise: Promise.resolve<SeasonStats | null>(null) }
  entry.promise = fetchSeasonStats(season, state.leagues[season]?.scoring_settings).then(s => {
    if (s) entry.last = s
    else entry.at = Date.now() - TTL_MS + RETRY_MS
    return entry.last
  })
  _cache.set(season, entry)
  return entry.promise
}
