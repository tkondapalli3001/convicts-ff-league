// Barrel — import from '@/lib/preview', not the individual files.
export {
  getPreviewSeason, getSeasonWeeks, getDefaultWeek,
  buildWeekPreviews, computeStandings,
} from './build-preview'
export type { MatchupPreview, TeamPreview } from './build-preview'
export { ordinal, formatOdds, weekStakes, clinchPhrase, eliminationPhrase } from './stakes'
export type { TeamStakes } from './stakes'
export { seasonSchedule, scheduleGaps, ownerSchedule } from './schedule'
export type { ScheduleRow } from './schedule'
export { loadSeasonStats, rankSeasonStats } from './season-stats'
export type { SeasonStats, PlayerSeason } from './season-stats'
export { fitScoringModel, simulatePlayoffOdds, hashSeed } from './playoff-odds'
export type { ScheduleGame, TeamResults, ScoringModel, PlayoffOdds } from './playoff-odds'
export { playoffScenarios } from './playoff-scenarios'
export type { PlayoffStatus, NeededResult, WeekScenario, TeamScenarios } from './playoff-scenarios'
export { smackFacts, smackPool, smackLines } from './smack-talk'
export type { SmackContext, SmackFact } from './smack-talk'
export { loadWeekProjections, loadPlayerMeta, loadPlayerMetaFromIndex, projectTeam, startersByRoster, scoreStats } from './projections'
export type { WeekProjections, ProjectedPlayer, NflGame } from './projections'
export { EMPTY_OVERLAY, liveSeasonEntry, withLiveSeason, lastFinalWeek, weekStatus, syncLiveSeason, loadWeekPairings } from './live'
export type { LiveOverlay, WeekStatus } from './live'
export { playerLookup, rosteredPlayerIds, buildTeamRosters } from './rosters'
export type { RosterPlayer, LineupSlot, TeamRoster } from './rosters'
export {
  DADDY_WIN_RATE, DADDY_MIN_GAMES, daddyOf, seriesStreak, seasonHonors, powerRanksThrough,
  seasonExtremes, lineupRegrets, careerWinsBefore, injuryReport, weeklyMoves,
} from './facts'
export type { DaddyStatus, SeasonHonors, PowerRankPoint, ScoreMark, InjuryReport, WeekMoves, LineupRegret } from './facts'
export { STREAK_BADGE_LEN, standingBadges, matchupBadges } from './flair'
export type { Badge } from './flair'
export { pickMatchupOfTheWeek, matchupFactors } from './matchup-of-the-week'
export type { MotwCandidate, MotwContext, MatchupOfTheWeek } from './matchup-of-the-week'
