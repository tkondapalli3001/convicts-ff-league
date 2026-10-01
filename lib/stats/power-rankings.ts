import { allPlayRecords } from './luck'
import type { Matchup } from '@/types'

export interface PowerRankingRow {
  name: string
  rank: number
  /** Places gained (+) or lost (−) since the previous week; null in week 1 or for new entries. */
  movement: number | null
  /** Power rating — see computePowerRankings. */
  score: number
  wins: number
  losses: number
  ties: number
  winPct: number
  pf: number
  avg: number
  high: number
  low: number
  /** Record if you'd played every team every week. */
  allPlayWins: number
  allPlayLosses: number
  allPlayTies: number
  /** All-play win% (ties ½), 0–1 — the rating's results term. */
  allPlayPct: number
  /** Position in the official standings (wins, then points for). */
  standing: number
  /** Current run of wins or losses (2+ games); a tie ends it. */
  streak: { type: 'W' | 'L'; len: number } | null
}

type Line = Omit<PowerRankingRow, 'rank' | 'movement' | 'standing'>

function isPlayed(g: Matchup): boolean {
  return g.pts1 > 0 || g.pts2 > 0
}

function lines(games: Matchup[]): Line[] {
  const scores: Record<string, number[]> = {}
  const rec: Record<string, { w: number; l: number; t: number }> = {}
  const results: Record<string, ('W' | 'L' | 'T')[]> = {}
  const weekScores: Record<number, { name: string; pts: number }[]> = {}

  for (const g of [...games].sort((x, y) => x.week - y.week)) {
    if (!isPlayed(g)) continue
    for (const [name, pts, opp] of [[g.team1, g.pts1, g.pts2], [g.team2, g.pts2, g.pts1]] as const) {
      ;(scores[name] ??= []).push(pts)
      const r = (rec[name] ??= { w: 0, l: 0, t: 0 })
      const result = pts > opp ? 'W' : pts < opp ? 'L' : 'T'
      if (result === 'W') r.w++
      else if (result === 'L') r.l++
      else r.t++
      ;(results[name] ??= []).push(result)
      ;(weekScores[g.week] ??= []).push({ name, pts })
    }
  }

  // Same all-play math as the Luck Index
  const allPlay = allPlayRecords(Object.values(weekScores))

  return Object.entries(scores).map(([name, pts]) => {
    const { w, l, t } = rec[name]
    const games = pts.length
    const pf = pts.reduce((a, b) => a + b, 0)
    const avg = pf / games
    const high = Math.max(...pts)
    const low = Math.min(...pts)
    const winPct = (w + t / 2) / games
    const ap = allPlay[name] ?? { wins: 0, losses: 0, ties: 0 }
    const apGames = ap.wins + ap.losses + ap.ties
    const allPlayPct = apGames ? (ap.wins + ap.ties / 2) / apGames : 0
    return {
      name,
      score: 0.6 * avg + 0.2 * (high + low) + 40 * allPlayPct,
      wins: w, losses: l, ties: t, winPct, pf, avg, high, low,
      allPlayWins: ap.wins, allPlayLosses: ap.losses, allPlayTies: ap.ties, allPlayPct,
      streak: currentStreak(results[name]),
    }
  })
}

function currentStreak(results: ('W' | 'L' | 'T')[]): PowerRankingRow['streak'] {
  const last = results[results.length - 1]
  if (!last || last === 'T') return null
  let len = 0
  for (let i = results.length - 1; i >= 0 && results[i] === last; i--) len++
  return len >= 2 ? { type: last, len } : null
}

function byScore(a: Line, b: Line): number {
  return b.score - a.score || b.winPct - a.winPct || b.pf - a.pf || a.name.localeCompare(b.name)
}

/**
 * Weekly power rankings using the Oberon Mt. Power Rating — the long-standing
 * standard formula for fantasy power rankings — with all-play win% in place of
 * the head-to-head win%, so schedule luck can't move a team's rating:
 *
 *   rating = ((avg × 6) + ((high + low) × 2) + ((all-play win% × 200) × 2)) / 10
 *          = 0.6 × avg + 0.2 × (high + low) + 40 × all-play win%
 *
 * Designed as 60% average score, 20% ceiling + floor, 20% winning percentage.
 * `games` should hold one season's final regular-season games; ties count as
 * half a win. Exact rating ties go to the better head-to-head record, then
 * points for.
 */
export function computePowerRankings(games: Matchup[], throughWeek: number): PowerRankingRow[] {
  const regular = games.filter(g => g.type === 'R')
  const now = lines(regular.filter(g => g.week <= throughWeek)).sort(byScore)
  const before = throughWeek > 1
    ? lines(regular.filter(g => g.week <= throughWeek - 1)).sort(byScore)
    : []
  const prevRank = new Map(before.map((r, i) => [r.name, i + 1]))

  const standings = [...now].sort((a, b) =>
    b.wins + b.ties / 2 - (a.wins + a.ties / 2) || b.pf - a.pf || a.name.localeCompare(b.name)
  )
  const standing = new Map(standings.map((r, i) => [r.name, i + 1]))

  return now.map((r, i) => {
    const prev = prevRank.get(r.name)
    return {
      ...r,
      rank: i + 1,
      movement: prev != null ? prev - (i + 1) : null,
      standing: standing.get(r.name)!,
    }
  })
}
