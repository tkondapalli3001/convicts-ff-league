// What a season's Sleeper league settings say about its calendar: whether
// it's over, where the playoffs start, and which weeks hold roster moves.
//
// Type-only imports on purpose: scripts/snapshot-history.mjs loads this file
// straight into Node (type stripping), where '@/' aliases can't resolve.
import type { SleeperLeague } from '@/types'

/** Fewest weeks of moves read for a finished season (2021 ran 18). */
const SEASON_TX_WEEKS = 17

/**
 * Historical stats only count completed seasons. A live season awards no
 * records, byes, finishes, or any other accolade until Sleeper marks it
 * complete — until then it exists only for live features (the season tab, drafts).
 */
export function isSeasonComplete(league: SleeperLeague | undefined): boolean {
  return (league?.status ?? 'complete') === 'complete'
}

/** First playoff week — Sleeper's playoff_week_start (15 when unset). Every week before it is regular season. */
export function playoffStartWeek(league: SleeperLeague | undefined): number {
  const week = league?.settings?.playoff_week_start
  return week && week > 0 ? week : 15
}

/**
 * The weeks a season's roster moves are filed under — the site and the
 * snapshot script both read these. A finished season: through its last week.
 * In season: the weeks so far plus the next, where waivers that clear after
 * this week's games land.
 */
export function transactionWeeks(league: SleeperLeague): number[] {
  const leg = league.settings?.leg ?? 0
  const n = league.status === 'complete' || leg <= 0 ? Math.max(SEASON_TX_WEEKS, leg) : leg + 1
  return Array.from({ length: n }, (_, i) => i + 1)
}
