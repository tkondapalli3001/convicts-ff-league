// Barrel — see individual files for each transformation:
//   lib/data-processing/resolve-owner.ts    → resolveOwnerName()
//   lib/data-processing/bracket-finish.ts   → getFinishFromBracket()
//   lib/data-processing/build-matchups.ts   → buildFlatMatchups()
//   lib/data-processing/build-seasons.ts    → buildOwnerSeasons()
//   lib/data-processing/build-draft-stats.ts → computePlayerWinRates(), computeDraftOwnership(), computeDraftStructure()
export { resolveOwnerName, getFinishFromBracket, buildFlatMatchups, buildOwnerSeasons, computePlayerWinRates, computeDraftOwnership, computeDraftStructure, computePlayerScores } from './data-processing/index'
export type { OwnershipEntry, DraftStructureEntry, DraftStrategy, PlayerScoreStat } from './data-processing/index'
