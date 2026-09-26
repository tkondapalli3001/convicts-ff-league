// Barrel — import from '@/lib/preview', not the individual files.
export {
  getPreviewSeason, getSeasonWeeks, getDefaultWeek,
  buildWeekPreviews, computeStandings,
} from './build-preview'
export type { MatchupPreview, TeamPreview } from './build-preview'
export { computeImplication, ordinal } from './implications'
export type { Implication, StandingRow } from './implications'
export { smackLines } from './smack-talk'
export type { SmackContext } from './smack-talk'
export { loadWeekProjections, loadPlayerMeta, loadPlayerMetaFromIndex, projectTeam, startersByRoster, scoreStats } from './projections'
export type { WeekProjections, ProjectedPlayer, NflGame } from './projections'
export { EMPTY_OVERLAY, liveSeasonEntry, withLiveSeason, lastFinalWeek, weekStatus, syncLiveSeason } from './live'
export type { LiveOverlay, WeekStatus } from './live'
export { playerLookup, rosteredPlayerIds, buildTeamRosters, buildRosterMoves } from './rosters'
export type { RosterPlayer, LineupSlot, TeamRoster, RosterMove } from './rosters'
