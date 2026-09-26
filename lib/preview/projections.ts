// Weekly projections + player metadata via Sleeper's projections endpoint.
//
// CAUTION: this endpoint is UNDOCUMENTED (Sleeper's public docs stop at
// league data). It works today but may change shape or disappear without
// notice — every failure path here returns null and the UI simply omits
// projections (rosters fall back to draft-pick names). Never let this module
// break a preview card or a roster.

import { getPlayersCache, playerDisplayName } from '@/lib/players-cache'
import type { LeagueState, SleeperMatchup } from '@/types'

export interface ProjectedPlayer {
  name: string
  position: string
  team: string | null
  /** Sleeper injury designation, e.g. 'Questionable', 'IR'; null when healthy. */
  injury: string | null
}

export interface NflGame {
  opponent: string
  /** Kickoff date, YYYY-MM-DD. */
  date: string | null
}

export interface WeekProjections {
  /** player_id → projected fantasy points under the league's scoring. */
  points: Record<string, number>
  /** player_id → name/position/team/injury for every player in the feed. */
  players: Record<string, ProjectedPlayer>
  /** NFL team → this week's game. A team missing here is on bye. */
  games: Record<string, NflGame>
}

const POSITIONS = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF']

// Sleeper's CDN caches the feed for 10 minutes — refetching sooner returns
// the same bytes, so polling callers only hit the network once per window.
const TTL_MS = 10 * 60_000
/** A failed fetch is retried after a minute instead of a full window. */
const RETRY_MS = 60_000

interface CacheEntry {
  at: number
  promise: Promise<WeekProjections | null>
  /** Last successful result — a failed refresh keeps serving it. */
  last: WeekProjections | null
}
const _cache = new Map<string, CacheEntry>()

/** Fantasy points for one stat line: every scored stat × the league's multiplier. */
export function scoreStats(stats: Record<string, number>, scoring: Record<string, number>): number {
  let total = 0
  for (const [key, mult] of Object.entries(scoring)) {
    const v = stats[key]
    if (typeof v === 'number' && typeof mult === 'number') total += v * mult
  }
  return Math.round(total * 100) / 100
}

/** Fallback when the league's scoring settings are unavailable: Sleeper's preset totals. */
function presetPoints(stats: Record<string, number>, recPts: number): number | null {
  if (recPts >= 1 && typeof stats.pts_ppr === 'number') return stats.pts_ppr
  if (recPts >= 0.5 && typeof stats.pts_half_ppr === 'number') return stats.pts_half_ppr
  if (typeof stats.pts_std === 'number') return stats.pts_std
  return typeof stats.pts_ppr === 'number' ? stats.pts_ppr : null
}

interface FeedRow {
  player_id?: string
  team?: string | null
  opponent?: string | null
  date?: string | null
  stats?: Record<string, number>
  player?: {
    first_name?: string
    last_name?: string
    position?: string
    team?: string | null
    injury_status?: string | null
  }
}

function toPlayer(row: FeedRow): ProjectedPlayer {
  const p = row.player ?? {}
  const position = p.position ?? ''
  // Team defenses come through as first "Kansas City", last "Chiefs" — the
  // nickname alone reads best in a lineup slot.
  const name = position === 'DEF'
    ? (p.last_name || row.player_id || '')
    : `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || `#${row.player_id}`
  return { name, position, team: p.team ?? row.team ?? null, injury: p.injury_status || null }
}

async function fetchProjections(
  season: number,
  week: number,
  scoring: Record<string, number> | undefined,
): Promise<WeekProjections | null> {
  try {
    const qs = POSITIONS.map(p => `position[]=${p}`).join('&')
    const res = await fetch(`https://api.sleeper.com/projections/nfl/${season}/${week}?season_type=regular&${qs}`)
    if (!res.ok) return null
    const rows: unknown = await res.json()
    if (!Array.isArray(rows)) return null

    const recPts = scoring?.rec ?? 0.5
    const out: WeekProjections = { points: {}, players: {}, games: {} }
    for (const row of rows as FeedRow[]) {
      const id = row?.player_id
      if (!id) continue
      out.players[id] = toPlayer(row)

      // Injured and inactive players arrive with an empty stat line — no
      // projection rather than a misleading 0
      const stats = row.stats ?? {}
      if (presetPoints(stats, recPts) != null) {
        out.points[id] = scoring ? scoreStats(stats, scoring) : presetPoints(stats, recPts)!
      }

      const team = row.team ?? row.player?.team
      if (team && row.opponent && !out.games[team]) {
        out.games[team] = { opponent: row.opponent, date: row.date ?? null }
      }
    }
    return Object.keys(out.players).length ? out : null
  } catch {
    return null
  }
}

/**
 * Cached weekly projections keyed by season+week. Safe to call on every poll:
 * the network is only touched once per TTL window, and a failed refresh keeps
 * returning the last good result.
 */
export function loadWeekProjections(state: LeagueState, season: number, week: number): Promise<WeekProjections | null> {
  const key = `${season}|${week}`
  const hit = _cache.get(key)
  if (hit && Date.now() - hit.at < TTL_MS) return hit.promise

  const scoring = state.leagues[season]?.scoring_settings
  const entry: CacheEntry = { at: Date.now(), last: hit?.last ?? null, promise: Promise.resolve(null) }
  entry.promise = fetchProjections(season, week, scoring).then(p => {
    if (p) entry.last = p
    else entry.at = Date.now() - TTL_MS + RETRY_MS
    return entry.last
  })
  _cache.set(key, entry)
  return entry.promise
}

// ─── Player metadata the weekly feed doesn't cover ────────────────────────────
// Players on bye are absent from the week's feed. Look them up one at a time
// (a handful per week) rather than downloading Sleeper's 15 MB player dump.

const _meta = new Map<string, Promise<ProjectedPlayer | null>>()

function fetchPlayerMeta(id: string): Promise<ProjectedPlayer | null> {
  // Team defenses are keyed by abbreviation ('PIT') and have no player record
  if (/^[A-Z]{2,3}$/.test(id)) {
    return Promise.resolve({ name: id, position: 'DEF', team: id, injury: null })
  }
  let p = _meta.get(id)
  if (!p) {
    p = fetch(`https://api.sleeper.com/players/nfl/${id}`)
      .then(res => (res.ok ? res.json() : null))
      .then(d => (d ? toPlayer({ player_id: id, player: d, team: d.team }) : null))
      .catch(() => null)
      .then(m => {
        if (!m) _meta.delete(id) // let the next sync retry
        return m
      })
    _meta.set(id, p)
  }
  return p
}

/** Metadata for the given player ids; ids that can't be resolved are omitted. */
export async function loadPlayerMeta(ids: string[]): Promise<Record<string, ProjectedPlayer>> {
  const found = await Promise.all(ids.map(id => fetchPlayerMeta(id).then(m => [id, m] as const)))
  const out: Record<string, ProjectedPlayer> = {}
  for (const [id, m] of found) if (m) out[id] = m
  return out
}

/**
 * Last resort when the projections host is unreachable: names from the
 * site's player index (lib/players-cache.ts). No injury designations there.
 */
export async function loadPlayerMetaFromIndex(ids: string[]): Promise<Record<string, ProjectedPlayer>> {
  const players = await getPlayersCache()
  const out: Record<string, ProjectedPlayer> = {}
  for (const id of ids) {
    const p = players[id]
    if (!p) continue
    out[id] = {
      name: playerDisplayName(p, id),
      position: p.position ?? '',
      team: p.team ?? null,
      injury: p.injury_status || null,
    }
  }
  return out
}

// ─── Team totals ──────────────────────────────────────────────────────────────

/** Sum a lineup's projected points; null when starters or projections are missing. */
export function projectTeam(starters: string[] | undefined, projections: WeekProjections | null): number | null {
  if (!starters?.length || !projections) return null
  let total = 0
  let found = 0
  for (const pid of starters) {
    if (pid === '0' || !pid) continue // empty lineup slot
    const pts = projections.points[pid]
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
