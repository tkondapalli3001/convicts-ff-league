// Barrel — import from '@/lib/stats', not the individual files.
export { gameKey, buildConsolationGameKeys, buildChampPathGameKeys, excludeManualGames } from './game-filters'
export { INACTIVE_OWNERS, championshipCount, shameCount, activeOwnerNames, buildCareerStats } from './career'
export type { CareerStats } from './career'
export { h2hRecord, h2hVsAll } from './h2h'
export type { H2HRecord, H2HOpponentRecord } from './h2h'
export { computeRecords } from './records'
export type { RecordsData } from './records'
