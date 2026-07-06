import type { LeagueState, Matchup } from '@/types'
import { EXCLUDED_GAME_SCORES } from '@/lib/constants'

/** Canonical key for one game from one perspective: year|||week|||teamA|||teamB */
export function gameKey(year: number, week: number, a: string, b: string): string {
  return `${year}|||${week}|||${a}|||${b}`
}

type BracketState = Pick<LeagueState, 'brackets' | 'rosterUserMaps' | 'leagues'>

/**
 * Keys for every consolation game: winners-bracket placement games that are
 * NOT the championship (3rd/5th/7th place), plus the entire losers bracket
 * (toilet bowl path). Both orderings of each pairing are included.
 */
export function buildConsolationGameKeys(state: BracketState): Set<string> {
  const { brackets, rosterUserMaps, leagues } = state
  const set = new Set<string>()
  for (const [yearStr, bracket] of Object.entries(brackets)) {
    const year = Number(yearStr)
    const rMap = rosterUserMaps[year] ?? {}
    const playoffStart = leagues[year]?.settings?.playoff_week_start ?? 15

    const addGame = (r: number, idA: number, idB: number) => {
      const week = playoffStart + (r - 1)
      const nameA = rMap[String(idA)] ?? `Team${idA}`
      const nameB = rMap[String(idB)] ?? `Team${idB}`
      set.add(gameKey(year, week, nameA, nameB))
      set.add(gameKey(year, week, nameB, nameA))
    }

    // Winners bracket non-championship games (3rd, 5th, 7th place, etc.)
    ;(bracket.winners ?? [])
      .filter(g => g.p && g.p !== 1)
      .forEach(g => {
        if (g.t1 != null && g.t2 != null) addGame(g.r, g.t1, g.t2)
        else if (g.w != null && g.l != null) addGame(g.r, g.w, g.l)
      })

    // All losers bracket games (toilet bowl path)
    ;(bracket.losers ?? []).forEach(g => {
      if (g.t1 != null && g.t2 != null) addGame(g.r, g.t1, g.t2)
      else if (g.w != null && g.l != null) addGame(g.r, g.w, g.l)
    })
  }
  return set
}

/**
 * Keys for championship-path games only: unplaced winners-bracket rounds plus
 * the championship game. Excludes 3rd/5th place games and the losers bracket.
 * Note: this is a DIFFERENT filter from buildConsolationGameKeys, used by
 * playoff-record views; the two sets are not complements of each other.
 */
export function buildChampPathGameKeys(state: BracketState): Set<string> {
  const { brackets, rosterUserMaps, leagues } = state
  const set = new Set<string>()
  for (const [yearStr, bracket] of Object.entries(brackets)) {
    const year = Number(yearStr)
    const rMap = rosterUserMaps[year] ?? {}
    const playoffStart = leagues[year]?.settings?.playoff_week_start ?? 15
    ;(bracket.winners ?? [])
      .filter(g => !g.p || g.p === 1)  // keep unplaced rounds + championship; exclude 3rd/5th
      .forEach(g => {
        const t1Id = g.t1 ?? null
        const t2Id = g.t2 ?? null
        if (t1Id != null && t2Id != null) {
          const week = playoffStart + (g.r - 1)
          const t1Name = rMap[String(t1Id)] ?? `Team${t1Id}`
          const t2Name = rMap[String(t2Id)] ?? `Team${t2Id}`
          set.add(gameKey(year, week, t1Name, t2Name))
          set.add(gameKey(year, week, t2Name, t1Name))
        }
      })
  }
  return set
}

/** Drop games listed in EXCLUDED_GAME_SCORES (manual bad-data overrides). */
export function excludeManualGames(matchups: Matchup[]): Matchup[] {
  return matchups.filter(g =>
    !EXCLUDED_GAME_SCORES.some(e => e.year === g.year && e.week === g.week &&
      (e.owner === g.team1 || e.owner === g.team2))
  )
}
