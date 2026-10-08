// Barrel — where the data comes from:
//   sleeper.ts   → Sleeper API fetchers (sleepFetch + one per endpoint)
//   snapshot.ts  → public/data/ season snapshots, lazy transactions, player index
//   players.ts   → getPlayersCache() — player names: the index first, Sleeper's dump as a fallback
export {
  sleepFetch, fetchLeague, fetchUsers, fetchRosters, fetchMatchupsForWeek, fetchWinnersBracket,
  fetchLosersBracket, fetchDrafts, fetchDraftPicks, fetchTransactions,
} from './sleeper'
export { loadSnapshotManifest, loadSnapshotSeason, loadSnapshotTransactions, loadPlayerIndex, loadAllSnapshotSeasons } from './snapshot'
export type { SnapshotSeason, SnapshotManifest, PlayerIndex } from './snapshot'
export { getPlayersCache, playerDisplayName } from './players'
export type { PlayerMetadata } from './players'
