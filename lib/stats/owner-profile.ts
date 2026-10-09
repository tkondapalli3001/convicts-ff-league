// Owners → one owner's profile page: the career line, finals record and byes,
// best and worst season and game, top rival, longest win streak, top scorers,
// and the games behind the Game Log and H2H tabs. Every game-based number
// leaves out consolation playoff games and the manual exclusions.

import type { Champion, LeagueState, Matchup, OwnerSeason, ShameLoser } from '@/types'
import { MANUAL_CHAMPS, MANUAL_SHAME, EARNINGS_DATA } from '@/lib/league'
import { isSeasonComplete } from '@/lib/data-processing'
import { buildConsolationGameKeys, excludeManualGames, gameKey } from './game-filters'
import { playoffByeYears } from './byes'

interface GameMark {
  pts: number
  opp: string
  year: number
  week: number
}

export interface OwnerProfile {
  /** Every season played, oldest first. */
  seasons: OwnerSeason[]
  wins: number
  losses: number
  winpct: number
  pfPerSeason: number
  paPerSeason: number
  pfPerGame: number
  paPerGame: number
  /** Highest (lowest) season win% — the earlier season on a tie. */
  bestSeason: OwnerSeason
  worstSeason: OwnerSeason
  titles: Champion[]
  toiletBowls: ShameLoser[]
  /** Net earnings, all seasons; null when the ledger has no line for the owner. */
  earnings: number | null
  finals: { wins: number; losses: number }
  byes: number
  bestGame: GameMark | null
  worstGame: GameMark | null
  /** The opponent who has beaten this owner most often, and the series record (ties count as wins). */
  topRival: { name: string; wins: number; losses: number } | null
  winStreak: { length: number; start: Matchup | null; end: Matchup | null }
  /** Most points scored as a starter for this owner, defenses left out. */
  topScorers: { name: string; pos: string; pts: number }[]
  /** This owner's games, oldest first. */
  games: Matchup[]
  /** Every league game that counts for head-to-head records, and everyone who played in one. */
  h2hGames: Matchup[]
  h2hOwners: string[]
}

/** One owner's profile; null when the owner has no seasons. */
export function ownerProfile(
  state: Pick<LeagueState, 'ownerSeasons' | 'allMatchups' | 'brackets' | 'rosterUserMaps' | 'leagues' | 'draftData' | 'matchups'>,
  name: string,
): OwnerProfile | null {
  const { ownerSeasons, allMatchups, brackets, rosterUserMaps, leagues, draftData, matchups } = state
  const seasons = ownerSeasons[name]
  if (!seasons?.length) return null

  // ── Games that count ─────────────────────────────────────────────────────
  const consolation = buildConsolationGameKeys({ brackets, rosterUserMaps, leagues })
  const h2hGames = excludeManualGames(allMatchups).filter(g =>
    g.type === 'R' || !consolation.has(gameKey(g.year, g.week, g.team1, g.team2))
  )
  const games = h2hGames.filter(g => g.team1 === name || g.team2 === name)

  // ── Career line ──────────────────────────────────────────────────────────
  const wins = seasons.reduce((a, s) => a + s.wins, 0)
  const losses = seasons.reduce((a, s) => a + s.losses, 0)
  const played = seasons.reduce((a, s) => a + s.wins + s.losses, 0)
  const pf = seasons.reduce((a, s) => a + s.pf, 0)
  const pa = seasons.reduce((a, s) => a + s.pa, 0)
  const seasonPct = (s: OwnerSeason) => s.wins / (s.wins + s.losses || 1)

  // ── Best and worst game ──────────────────────────────────────────────────
  const scores = games.map(g => ({
    pts: g.team1 === name ? g.pts1 : g.pts2,
    opp: g.team1 === name ? g.team2 : g.team1,
    year: g.year,
    week: g.week,
  })).filter(s => s.pts > 0)
  const bestGame = scores.length ? scores.reduce((m, s) => s.pts > m.pts ? s : m, scores[0]) : null
  const worstGame = scores.length ? scores.reduce((m, s) => s.pts < m.pts ? s : m, scores[0]) : null

  // ── Top rival ────────────────────────────────────────────────────────────
  const lossesTo: Record<string, number> = {}
  games.forEach(g => {
    const opp    = g.team1 === name ? g.team2 : g.team1
    const myPts  = g.team1 === name ? g.pts1 : g.pts2
    const oppPts = g.team1 === name ? g.pts2 : g.pts1
    if (oppPts > myPts) lossesTo[opp] = (lossesTo[opp] || 0) + 1
  })
  const rivalName = Object.entries(lossesTo).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
  let rivalW = 0, rivalL = 0
  if (rivalName) {
    games.forEach(g => {
      const opp = g.team1 === name ? g.team2 : g.team1
      if (opp !== rivalName) return
      const myPts  = g.team1 === name ? g.pts1 : g.pts2
      const oppPts = g.team1 === name ? g.pts2 : g.pts1
      if (myPts >= oppPts) rivalW++; else rivalL++
    })
  }

  // ── Longest win streak (a tie counts as a win) ──────────────────────────
  const inOrder = [...games].sort((a, b) => a.year - b.year || a.week - b.week)
  let maxStreak = 0, curStreak = 0
  let streakStart = inOrder.length > 0 ? inOrder[0] : null
  let streakEnd   = inOrder.length > 0 ? inOrder[0] : null
  let tmpStart    = inOrder.length > 0 ? inOrder[0] : null
  inOrder.forEach(g => {
    const myPts  = g.team1 === name ? g.pts1 : g.pts2
    const oppPts = g.team1 === name ? g.pts2 : g.pts1
    if (myPts >= oppPts) {
      if (curStreak === 0) tmpStart = g
      curStreak++
      if (curStreak > maxStreak) { maxStreak = curStreak; streakStart = tmpStart; streakEnd = g }
    } else {
      curStreak = 0
    }
  })

  // ── Top scorers: starter points per player, completed seasons only ───────
  // Names and positions come from the draft picks
  const playerNameMap: Record<string, string> = {}
  const playerPosMap: Record<string, string> = {}
  Object.values(draftData).forEach(({ picks }) => {
    picks.forEach(p => {
      if (!playerNameMap[p.player_id])
        playerNameMap[p.player_id] = [p.metadata.first_name, p.metadata.last_name].filter(Boolean).join(' ')
      if (!playerPosMap[p.player_id])
        playerPosMap[p.player_id] = p.metadata.position ?? ''
    })
  })
  const ownerRosterIds: Record<number, number> = {}
  Object.entries(rosterUserMaps).forEach(([yearStr, rMap]) => {
    const entry = Object.entries(rMap).find(([, owner]) => owner === name)
    if (entry) ownerRosterIds[Number(yearStr)] = Number(entry[0])
  })
  const playerPts: Record<string, { name: string; pos: string; pts: number }> = {}
  Object.entries(matchups).forEach(([yearStr, weeks]) => {
    const year = Number(yearStr)
    if (!isSeasonComplete(leagues[year])) return
    const rId = ownerRosterIds[year]
    if (rId == null) return
    Object.values(weeks).forEach(({ matchups: weekMatchups }) => {
      const mine = weekMatchups.find(m => m.roster_id === rId)
      if (!mine?.starters?.length || !mine.starters_points?.length) return
      mine.starters.forEach((playerId, i) => {
        const pos = playerPosMap[playerId] ?? ''
        // Exclude defenses by position or by team-abbreviation ID (Sleeper uses e.g. "NE", "KC")
        if (pos === 'DEF' || /^[A-Z]{2,3}$/.test(playerId)) return
        const pts = mine.starters_points![i] ?? 0
        if (pts <= 0) return
        if (!playerPts[playerId])
          playerPts[playerId] = { name: playerNameMap[playerId] || playerId, pos, pts: 0 }
        playerPts[playerId].pts += pts
      })
    })
  })

  // ── Finals record (completed seasons) ────────────────────────────────────
  let finalsW = 0, finalsL = 0
  for (const [yearStr, bracket] of Object.entries(brackets)) {
    const year = Number(yearStr)
    if (!isSeasonComplete(leagues[year])) continue
    const entry = Object.entries(rosterUserMaps[year] ?? {}).find(([, owner]) => owner === name)
    if (!entry) continue
    const rId = Number(entry[0])
    const champGame = bracket.winners?.find(g => g.p === 1)
    if (champGame) {
      if (champGame.w === rId) finalsW++
      else if (champGame.l === rId) finalsL++
    }
  }

  return {
    seasons: [...seasons].sort((a, b) => a.year - b.year),
    wins,
    losses,
    winpct: wins / (wins + losses || 1),
    pfPerSeason: pf / seasons.length,
    paPerSeason: pa / seasons.length,
    pfPerGame: pf / Math.max(1, played),
    paPerGame: pa / Math.max(1, played),
    bestSeason: seasons.reduce((b, s) => seasonPct(s) > seasonPct(b) ? s : b, seasons[0]),
    worstSeason: seasons.reduce((b, s) => seasonPct(s) < seasonPct(b) ? s : b, seasons[0]),
    titles: MANUAL_CHAMPS.filter(c => c.winner?.includes(name)),
    toiletBowls: MANUAL_SHAME.filter(s => s.loser === name),
    earnings: EARNINGS_DATA.find(e => e.owner === name)?.total ?? null,
    finals: { wins: finalsW, losses: finalsL },
    byes: playoffByeYears({ brackets, rosterUserMaps, leagues })[name]?.length ?? 0,
    bestGame,
    worstGame,
    topRival: rivalName ? { name: rivalName, wins: rivalW, losses: rivalL } : null,
    winStreak: { length: maxStreak, start: streakStart, end: streakEnd },
    topScorers: Object.values(playerPts).sort((a, b) => b.pts - a.pts).slice(0, 5),
    games,
    h2hGames,
    h2hOwners: [...new Set(h2hGames.flatMap(g => [g.team1, g.team2]))],
  }
}
