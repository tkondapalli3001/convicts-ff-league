// Roster views for the 2026 tab: every team's lineup, bench, and IR for one
// week, joined with projections and player metadata. Pure — the live data
// comes in through `state` (see live.ts) and the projections argument.

import type { LeagueState, SleeperMatchup, Transaction } from '@/types'
import type { ProjectedPlayer, WeekProjections } from './projections'
import type { WeekStatus } from './live'

export interface RosterPlayer {
  id: string
  name: string
  position: string
  team: string | null
  /** e.g. 'vs DAL · Sun'; 'BYE' when the NFL team has no game; null if unknown. */
  game: string | null
  injury: string | null
  proj: number | null
  /** Points scored this week; null before the player's game. */
  pts: number | null
}

export interface LineupSlot {
  /** Display label: QB, RB, WR, TE, FLEX, K, DEF… */
  slot: string
  /** null = empty slot. */
  player: RosterPlayer | null
}

export interface TeamRoster {
  owner: string
  rosterId: number
  wins: number
  losses: number
  ties: number
  /** Position in Sleeper's standings: wins, then points for. */
  standing: number
  /** This week's opponent; null on a bye or before pairings exist. */
  opponent: string | null
  starters: LineupSlot[]
  bench: RosterPlayer[]
  reserve: RosterPlayer[]
  taxi: RosterPlayer[]
  projTotal: number | null
  ptsTotal: number | null
}

export interface RosterMove {
  id: string
  type: 'trade' | 'waiver' | 'free_agent'
  owners: string[]
  adds: { owner: string; player: string }[]
  drops: { owner: string; player: string }[]
  /** FAAB spent on a waiver claim. */
  bid: number | null
  at: number
}

const SLOT_LABELS: Record<string, string> = {
  SUPER_FLEX: 'SFLX',
  WRRB_FLEX: 'W/R',
  REC_FLEX: 'W/T',
  IDP_FLEX: 'IDP',
}
const NON_STARTER_SLOTS = new Set(['BN', 'IR', 'TAXI'])
const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** Local calendar date as YYYY-MM-DD, comparable with the feed's game dates. */
function localDate(now: Date): string {
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${m}-${d}`
}

function gameLabel(team: string | null, projections: WeekProjections | null): string | null {
  if (!team || !projections) return null
  const game = projections.games[team]
  if (!game) return 'BYE'
  const day = game.date ? WEEKDAY[new Date(`${game.date}T12:00:00`).getDay()] : null
  return day ? `vs ${game.opponent} · ${day}` : `vs ${game.opponent}`
}

/** Player lookup: the week's feed, then one-off lookups, then draft metadata. */
export function playerLookup(
  state: LeagueState,
  season: number,
  projections: WeekProjections | null,
  extra: Record<string, ProjectedPlayer>,
): (id: string) => ProjectedPlayer {
  const drafted: Record<string, ProjectedPlayer> = {}
  for (const pick of state.draftData[season]?.picks ?? []) {
    const md = pick.metadata
    drafted[pick.player_id] = {
      name: md.position === 'DEF'
        ? (md.last_name || pick.player_id)
        : `${md.first_name ?? ''} ${md.last_name ?? ''}`.trim() || `#${pick.player_id}`,
      position: md.position,
      team: md.team ?? null,
      injury: null,
    }
  }
  return id =>
    projections?.players[id] ?? extra[id] ?? drafted[id]
    ?? { name: /^[A-Z]{2,3}$/.test(id) ? id : `#${id}`, position: /^[A-Z]{2,3}$/.test(id) ? 'DEF' : '', team: null, injury: null }
}

/** Every player id on a roster this week (for metadata lookups). */
export function rosteredPlayerIds(state: LeagueState, season: number, week: number): string[] {
  const ids = new Set<string>()
  for (const m of state.matchups[season]?.[week]?.matchups ?? []) m.players?.forEach(p => ids.add(p))
  for (const r of state.rosters[season] ?? []) {
    r.players?.forEach(p => ids.add(p))
    r.reserve?.forEach(p => ids.add(p))
    r.taxi?.forEach(p => ids.add(p))
  }
  ids.delete('0')
  return [...ids]
}

export function buildTeamRosters(
  state: LeagueState,
  season: number,
  week: number,
  status: WeekStatus,
  projections: WeekProjections | null,
  lookup: (id: string) => ProjectedPlayer,
  now: Date = new Date(),
): TeamRoster[] {
  const league = state.leagues[season]
  const rMap = state.rosterUserMaps[season] ?? {}
  const rows: SleeperMatchup[] = state.matchups[season]?.[week]?.matchups ?? []
  const byRoster = new Map(rows.map(m => [m.roster_id, m]))
  const slots = (league?.roster_positions ?? []).filter(s => !NON_STARTER_SLOTS.has(s))
  const today = localDate(now)
  const started = status !== 'upcoming'

  const opponentOf = (m: SleeperMatchup | undefined): string | null => {
    if (!m || m.matchup_id == null) return null
    const opp = rows.find(o => o.matchup_id === m.matchup_id && o.roster_id !== m.roster_id)
    return opp ? rMap[String(opp.roster_id)] ?? `Team ${opp.roster_id}` : null
  }

  const player = (id: string, m: SleeperMatchup | undefined): RosterPlayer => {
    const meta = lookup(id)
    const scored = m?.players_points?.[id]
    const game = gameLabel(meta.team, projections)
    const gameDate = meta.team ? projections?.games[meta.team]?.date ?? null : null
    // Sleeper reports 0 for players who haven't played yet (or are on bye) —
    // show nothing until their game date instead of a misleading zero
    const kicked = game !== 'BYE' && (gameDate == null || gameDate <= today)
    return {
      id,
      name: meta.name,
      position: meta.position,
      team: meta.team,
      game,
      injury: meta.injury,
      proj: projections?.points[id] ?? null,
      pts: started && typeof scored === 'number' && (scored !== 0 || kicked) ? scored : null,
    }
  }

  const standings = [...(state.rosters[season] ?? [])]
    .map(r => ({
      id: r.roster_id,
      wins: r.settings?.wins ?? 0,
      ties: r.settings?.ties ?? 0,
      pf: (r.settings?.fpts ?? 0) + (r.settings?.fpts_decimal ?? 0) / 100,
    }))
    .sort((a, b) => b.wins + b.ties / 2 - (a.wins + a.ties / 2) || b.pf - a.pf)
  const standingOf = new Map(standings.map((s, i) => [s.id, i + 1]))

  return (state.rosters[season] ?? []).map(r => {
    const m = byRoster.get(r.roster_id)
    // The week's matchup row has the freshest lineup (Sleeper refreshes it
    // every minute vs every five for rosters); fall back before pairings exist
    const starterIds = m?.starters ?? r.starters ?? []
    const allIds = m?.players ?? r.players ?? []
    const reserveIds = new Set(r.reserve ?? [])
    const taxiIds = new Set(r.taxi ?? [])
    const startSet = new Set(starterIds)

    const starters: LineupSlot[] = starterIds.map((id, i) => ({
      slot: SLOT_LABELS[slots[i]] ?? slots[i] ?? '—',
      player: id && id !== '0' ? player(id, m) : null,
    }))
    const bench = allIds
      .filter(id => !startSet.has(id) && !reserveIds.has(id) && !taxiIds.has(id))
      .map(id => player(id, m))
      .sort((a, b) => (b.proj ?? -1) - (a.proj ?? -1))

    const projected = starters.flatMap(s => (s.player?.proj != null ? [s.player.proj] : []))
    const filled = starters.filter(s => s.player).length

    return {
      owner: rMap[String(r.roster_id)] ?? `Team ${r.roster_id}`,
      rosterId: r.roster_id,
      wins: r.settings?.wins ?? 0,
      losses: r.settings?.losses ?? 0,
      ties: r.settings?.ties ?? 0,
      standing: standingOf.get(r.roster_id) ?? 0,
      opponent: opponentOf(m),
      starters,
      bench,
      reserve: [...reserveIds].map(id => player(id, m)),
      taxi: [...taxiIds].map(id => player(id, m)),
      // Same rule as projectTeam: most of the lineup must be projectable
      projTotal: projections && projected.length >= Math.max(1, Math.floor(filled * 0.6))
        ? projected.reduce((a, b) => a + b, 0)
        : null,
      ptsTotal: started && m ? m.points ?? 0 : null,
    }
  })
}

/** The week's completed roster moves, newest first. */
export function buildRosterMoves(
  transactions: Transaction[],
  rMap: Record<string, string>,
  lookup: (id: string) => ProjectedPlayer,
): RosterMove[] {
  const owner = (rid: number) => rMap[String(rid)] ?? `Team ${rid}`
  return transactions
    .filter(t => t.status === 'complete')
    .map(t => ({
      id: t.transaction_id,
      type: t.type,
      owners: t.roster_ids.map(owner),
      adds: Object.entries(t.adds ?? {}).map(([pid, rid]) => ({ owner: owner(rid), player: lookup(pid).name })),
      drops: Object.entries(t.drops ?? {}).map(([pid, rid]) => ({ owner: owner(rid), player: lookup(pid).name })),
      bid: t.type === 'waiver' ? t.settings?.waiver_bid ?? null : null,
      at: t.status_updated ?? t.created,
    }))
    .sort((a, b) => b.at - a.at)
}
