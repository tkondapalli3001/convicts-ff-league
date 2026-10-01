// Barrel — see individual files for each transformation:
//   lib/data-processing/resolve-owner.ts    → resolveOwnerName()
//   lib/data-processing/bracket-finish.ts   → getFinishFromBracket()
//   lib/data-processing/build-matchups.ts   → buildFlatMatchups()
//   lib/data-processing/build-seasons.ts    → buildOwnerSeasons()
//   lib/data-processing/build-draft-stats.ts → computePlayerWinRates(), computeDraftOwnership(), computeDraftStructure()
//   lib/data-processing/draft-board.ts      → buildDraftBoard()
export { resolveOwnerName, getFinishFromBracket, buildFlatMatchups, flattenSeasonMatchups, buildOwnerSeasons, isSeasonComplete, computePlayerWinRates, computeDraftOwnership, computeDraftStructure, computePlayerScores, buildDraftSlotRows, buildDraftBoard } from './data-processing/index'
export type { OwnershipEntry, DraftStructureEntry, DraftStrategy, PlayerScoreStat, DraftSlotRow, DraftBoardData } from './data-processing/index'
