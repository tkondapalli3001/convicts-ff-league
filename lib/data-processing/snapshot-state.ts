import type { LeagueState, SleeperRoster, SleeperUser } from '@/types'
import type { SnapshotSeason } from '@/lib/sources'
import { resolveOwnerName } from './resolve-owner'
import { isSeasonComplete, playoffStartWeek } from './season-settings'
import { buildFlatMatchups } from './build-matchups'
import { buildOwnerSeasons } from './build-seasons'

/** roster_id → canonical owner name for one season. */
export function rosterOwnerMap(users: SleeperUser[], rosters: SleeperRoster[]): Record<string, string> {
  const byId = new Map(users.map(u => [u.user_id, u]))
  return Object.fromEntries(rosters.map(r => {
    const u = byId.get(r.owner_id)
    return [String(r.roster_id), u ? resolveOwnerName(u.user_id, u.display_name) : `Team ${r.roster_id}`]
  }))
}

/**
 * Each owner's picture, from seasons' users oldest → newest, so each owner ends
 * up with their latest: the league team photo Sleeper shows inside the league
 * when they've set one, else the account avatar.
 */
export function ownerAvatars(usersBySeason: SleeperUser[][]): Record<string, string> {
  const map: Record<string, string> = {}
  for (const users of usersBySeason) {
    for (const u of users) {
      const name = resolveOwnerName(u.user_id, u.display_name)
      const teamPic = u.metadata?.avatar?.startsWith('https://') ? u.metadata.avatar : null
      const pic = teamPic ?? (u.avatar ? `https://sleepercdn.com/avatars/${u.avatar}` : null)
      if (pic && name) map[name] = pic
    }
  }
  return map
}

/**
 * The league as LeagueContext builds it when Sleeper adds nothing: every
 * snapshotted season, no live one. For build-time rendering (Home's hero,
 * Records → Extremes), so the archive can paint before the browser loads any data.
 */
export function stateFromSnapshots(seasons: SnapshotSeason[]): LeagueState {
  const state: LeagueState = {
    leagues: {}, users: {}, rosters: {}, rosterUserMaps: {}, matchups: {}, brackets: {},
    ownerAvatarMap: {}, ownerSeasons: {}, allMatchups: [], leagueChain: [], draftData: {},
    loaded: true, error: null, loadingText: '', years: [],
  }
  for (const s of [...seasons].sort((a, b) => a.year - b.year)) {
    const start = playoffStartWeek(s.league)
    state.leagues[s.year] = s.league
    state.users[s.year] = s.users
    state.rosters[s.year] = s.rosters
    state.rosterUserMaps[s.year] = rosterOwnerMap(s.users, s.rosters)
    state.matchups[s.year] = Object.fromEntries(
      Object.entries(s.matchupsByWeek).map(([w, m]) => [Number(w), { matchups: m, isPlayoff: Number(w) >= start }]),
    )
    state.brackets[s.year] = { winners: s.winnersBracket, losers: s.losersBracket }
    if (s.draft) state.draftData[s.year] = s.draft
    state.leagueChain.push({ id: s.league.league_id, year: s.year, data: s.league })
  }
  state.years = state.leagueChain.map(c => c.year).filter(y => isSeasonComplete(state.leagues[y]))
  state.ownerAvatarMap = ownerAvatars(state.leagueChain.map(c => state.users[c.year]))
  state.allMatchups = buildFlatMatchups(state)
  state.ownerSeasons = buildOwnerSeasons(state)
  return state
}
