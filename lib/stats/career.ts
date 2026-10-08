import type { LeagueState } from '@/types'
import { MANUAL_CHAMPS, MANUAL_SHAME, EARNINGS_DATA, USER_ID_TO_OWNER, INACTIVE_OWNERS } from '@/lib/league'
import { fmtMoney } from '@/lib/utils'

/**
 * Championship count for an owner. Substring match is intentional: shared
 * titles are stored as e.g. winner "Armaan & Dustin", and half-titles weigh 0.5.
 */
export function championshipCount(name: string): number {
  return MANUAL_CHAMPS.filter(c => c.winner?.includes(name))
    .reduce((sum, c) => sum + (c.half ? 0.5 : 1), 0)
}

export function shameCount(name: string): number {
  return MANUAL_SHAME.filter(s => s.loser === name).length
}

/** Canonical owner names that have season data, minus inactive owners. */
export function activeOwnerNames(ownerSeasons: LeagueState['ownerSeasons']): string[] {
  const canonicalNames = [...new Set(Object.values(USER_ID_TO_OWNER))]
  return canonicalNames.filter(n => ownerSeasons[n] && !INACTIVE_OWNERS.has(n))
}

export interface CareerStats {
  name: string
  allW: number
  allL: number
  winpct: number
  avgPF: number
  avgPFperGame: number
  totalPF: number
  playoffApps: number
  champs: number
  shame: number
  numSeasons: number
  earn: number | null
  sparkData: number[]
  bestSeasonYear: number | null
  bestSeasonWins: number | null
  bestSeasonLosses: number | null
  bestSeasonFinish: number | null
  topRival: string | null
  singleGameHigh: number | null
  singleGameLow: number | null
}

/**
 * All-time career stats per active owner, sorted by win% (total PF tiebreak).
 * Single source of truth — home standings, search cards, and leaderboards all
 * derive from this.
 */
export function buildCareerStats(
  state: Pick<LeagueState, 'ownerSeasons' | 'allMatchups'>,
): CareerStats[] {
  const { ownerSeasons, allMatchups } = state
  return activeOwnerNames(ownerSeasons)
    .map(name => {
      const seasons = ownerSeasons[name] || []
      const allW = seasons.reduce((a, s) => a + s.wins, 0)
      const allL = seasons.reduce((a, s) => a + s.losses, 0)
      const winpct = allW / (allW + allL || 1)
      const totalPF = seasons.reduce((a, s) => a + s.pf, 0)
      const avgPF = seasons.length ? totalPF / seasons.length : 0
      const avgPFperGame = (allW + allL) > 0 ? totalPF / (allW + allL) : 0
      const playoffApps = seasons.filter(s => s.inPlayoffs).length
      const champs = championshipCount(name)
      const shame = shameCount(name)
      const earn = EARNINGS_DATA.find(e => e.owner === name)

      const sparkData = [...seasons]
        .sort((a, b) => a.year - b.year)
        .map(s => (s.wins / (s.wins + s.losses || 1)) * 100)

      const eligibleSeasons = seasons.filter(s => s.wins + s.losses > 0)
      const bestSeason = eligibleSeasons.length
        ? eligibleSeasons.reduce((best, s) => {
            const pct = s.wins / (s.wins + s.losses)
            const bestPct = best.wins / (best.wins + best.losses)
            if (pct !== bestPct) return pct > bestPct ? s : best
            const sFinish = s.finish ?? Infinity
            const bestFinish = best.finish ?? Infinity
            return sFinish < bestFinish ? s : best
          })
        : null

      // Per-owner matchup extremes
      const ownerMatchups = allMatchups.filter(m => m.team1 === name || m.team2 === name)
      let singleGameHigh: number | null = null
      let singleGameLow: number | null = null
      for (const m of ownerMatchups) {
        const pts = m.team1 === name ? m.pts1 : m.pts2
        if (pts > 0) {
          if (singleGameHigh === null || pts > singleGameHigh) singleGameHigh = pts
          if (singleGameLow === null || pts < singleGameLow) singleGameLow = pts
        }
      }

      // Top rival = opponent who has beaten this owner the most
      const lossesTo: Record<string, number> = {}
      for (const m of ownerMatchups) {
        if (m.loser === name && m.winner !== name) {
          lossesTo[m.winner] = (lossesTo[m.winner] ?? 0) + 1
        }
      }
      const topRivalEntry = Object.entries(lossesTo).sort((a, b) => b[1] - a[1])[0]
      const topRival = topRivalEntry ? topRivalEntry[0] : null

      return {
        name,
        allW,
        allL,
        winpct,
        avgPF,
        avgPFperGame,
        totalPF,
        playoffApps,
        champs,
        shame,
        numSeasons: seasons.length,
        earn: earn?.total ?? null,
        sparkData,
        bestSeasonYear: bestSeason?.year ?? null,
        bestSeasonWins: bestSeason?.wins ?? null,
        bestSeasonLosses: bestSeason?.losses ?? null,
        bestSeasonFinish: bestSeason?.finish ?? null,
        topRival,
        singleGameHigh,
        singleGameLow,
      }
    })
    // Primary: win%, Secondary: total PF
    .sort((a, b) => {
      const diff = b.winpct - a.winpct
      if (Math.abs(diff) > 0.0001) return diff
      return b.totalPF - a.totalPF
    })
}

// ─── Records → Career Milestones ──────────────────────────────────────────────

export interface Milestone {
  value: string
  context: string
}

const titleYears = (name: string) =>
  MANUAL_CHAMPS.filter(c => c.winner?.includes(name)).map(c => c.year).sort((a, b) => a - b)
const toiletYears = (name: string) =>
  MANUAL_SHAME.filter(s => s.loser === name).map(s => s.year).sort((a, b) => a - b)

/** Whoever has the most of something, every leader listed: "2×", "Daniyaal · 2020 & 2023". */
function mostOf(count: (name: string) => number, years: (name: string) => number[]): Milestone {
  const names = [...new Set(Object.values(USER_ID_TO_OWNER))]
  const best = Math.max(0, ...names.map(count))
  const leaders = names.filter(n => count(n) === best)
  return { value: `${best}×`, context: leaders.map(n => `${n} · ${years(n).join(' & ')}`).join(' / ') }
}

/**
 * Records → Career Milestones: the biggest net winner and loser, and the most
 * titles and toilet bowls — computed from the league's history, never typed.
 */
export function careerMilestones(): Record<'mostWon' | 'mostLost' | 'mostTitles' | 'mostToilets', Milestone> {
  const byTotal = [...EARNINGS_DATA].sort((a, b) => b.total - a.total)
  const top = byTotal[0]
  const bottom = byTotal[byTotal.length - 1]

  const [bestYear, bestNet] = Object.entries(top.byYear)
    .map(([y, net]) => [Number(y), net] as const)
    .reduce((a, b) => (b[1] > a[1] ? b : a))
  const leagueBest = Math.max(...EARNINGS_DATA.flatMap(e => Object.values(e.byYear)))
  const wonIt = titleYears(top.owner).includes(bestYear)

  const seasons = Object.keys(bottom.byYear).length
  const rings = championshipCount(bottom.owner)
  const toilets = toiletYears(bottom.owner)

  return {
    mostWon: {
      value: fmtMoney(top.total),
      context: `${top.owner} — ${wonIt ? 'won' : 'best season'} ${bestYear} for ${fmtMoney(bestNet)}`
        + (bestNet === leagueBest ? ' in biggest single-year payout' : ''),
    },
    mostLost: {
      value: fmtMoney(bottom.total),
      context: `${bottom.owner} — ${seasons} season${seasons === 1 ? '' : 's'}, ${rings} ring${rings === 1 ? '' : 's'}, `
        + `${toilets.length}x toilet bowl${toilets.length ? ` (${toilets.join(' & ')})` : ''}`,
    },
    mostTitles: mostOf(championshipCount, titleYears),
    mostToilets: mostOf(shameCount, toiletYears),
  }
}
