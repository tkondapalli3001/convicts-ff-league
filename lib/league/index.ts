// Barrel — everything hand-maintained about the league, in one folder:
//   config.ts       → LEAGUE_ID, CURRENT_SEASON, SLEEPER_API, BASE_PATH
//   owners.ts       → USER_ID_TO_OWNER, DISPLAY_NAME_TO_OWNER, INACTIVE_OWNERS, OWNER_FULL_NAMES,
//                     OWNER_COLORS
//   history.ts      → BUY_INS, NEXT_DRAFT_AT/LABEL, MANUAL_CHAMPS, MANUAL_SHAME,
//                     MANUAL_PLAYOFF_OVERRIDES, EXCLUDED_GAME_SCORES
//   earnings.ts     → EARNINGS_DATA
//   trash-talk.ts   → TRASH_TALK
//   stock-picks.ts  → STOCK_PICKS, MARKET_BENCHMARK, STOCK_PICK_SEASON
export { LEAGUE_ID, CURRENT_SEASON, SLEEPER_API, BASE_PATH } from './config'
export { USER_ID_TO_OWNER, DISPLAY_NAME_TO_OWNER, INACTIVE_OWNERS, OWNER_COLORS, OWNER_FULL_NAMES } from './owners'
export { MANUAL_CHAMPS, MANUAL_SHAME, MANUAL_PLAYOFF_OVERRIDES, BUY_INS, EXCLUDED_GAME_SCORES, NEXT_DRAFT_AT, NEXT_DRAFT_LABEL } from './history'
export { EARNINGS_DATA } from './earnings'
export { TRASH_TALK } from './trash-talk'
export { STOCK_PICKS, MARKET_BENCHMARK, STOCK_PICK_SEASON } from './stock-picks'
export type { StockPick } from './stock-picks'
