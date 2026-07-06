import type { Matchup } from '@/types'

export interface H2HRecord {
  /** All games between the pair, most recent first. */
  games: Matchup[]
  winsA: number
  winsB: number
  avgA: number
  avgB: number
  highA: number
  highB: number
  lastGame: Matchup | null
}

/**
 * Head-to-head record between two owners. Ties count as a win for owner A
 * (>= comparison), matching the convention used across the site.
 */
export function h2hRecord(matchups: Matchup[], a: string, b: string): H2HRecord {
  const games = matchups
    .filter(g =>
      (g.team1 === a && g.team2 === b) ||
      (g.team1 === b && g.team2 === a)
    )
    .sort((x, y) => y.year - x.year || y.week - x.week)

  if (!games.length) return { games, winsA: 0, winsB: 0, avgA: 0, avgB: 0, highA: 0, highB: 0, lastGame: null }

  const winsA = games.filter(g =>
    (g.team1 === a && g.pts1 >= g.pts2) ||
    (g.team2 === a && g.pts2 >= g.pts1)
  ).length
  const winsB = games.length - winsA

  const ptsA = games.map(g => g.team1 === a ? g.pts1 : g.pts2)
  const ptsB = games.map(g => g.team1 === b ? g.pts1 : g.pts2)
  const avgA = ptsA.reduce((x, y) => x + y, 0) / games.length
  const avgB = ptsB.reduce((x, y) => x + y, 0) / games.length
  const highA = Math.max(...ptsA)
  const highB = Math.max(...ptsB)

  return { games, winsA, winsB, avgA, avgB, highA, highB, lastGame: games[0] }
}

export interface H2HOpponentRecord {
  opp: string
  games: Matchup[]
  w: number
  l: number
  pfAvg: number
  paAvg: number
}

/** One owner's H2H record against each opponent they've actually played. */
export function h2hVsAll(matchups: Matchup[], owner: string, opponents: string[]): H2HOpponentRecord[] {
  return opponents
    .filter(n => n !== owner)
    .map(opp => {
      const games = matchups.filter(
        g => (g.team1 === owner && g.team2 === opp) || (g.team1 === opp && g.team2 === owner)
      )
      if (!games.length) return null

      let w = 0, pfTotal = 0, paTotal = 0
      games.forEach(g => {
        const myPts = g.team1 === owner ? g.pts1 : g.pts2
        const oppPts = g.team1 === owner ? g.pts2 : g.pts1
        pfTotal += myPts
        paTotal += oppPts
        if (myPts >= oppPts) w++
      })
      const l = games.length - w
      return { opp, games, w, l, pfAvg: pfTotal / games.length, paAvg: paTotal / games.length }
    })
    .filter((r): r is H2HOpponentRecord => r !== null)
}
