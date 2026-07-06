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
export { loadWeekProjections, projectTeam, startersByRoster } from './projections'
