// Barrel — see individual files for each domain:
//   lib/config.ts          → LEAGUE_ID, SLEEPER_API
//   lib/owner-map.ts       → USER_ID_TO_OWNER, DISPLAY_NAME_TO_OWNER, OWNER_COLORS
//   lib/league-history.ts  → MANUAL_CHAMPS, MANUAL_SHAME, MANUAL_PLAYOFF_OVERRIDES, BUY_INS, EXCLUDED_GAME_SCORES
//   lib/earnings-data.ts   → EARNINGS_DATA
//   lib/narratives.ts      → TRASH_TALK
export { LEAGUE_ID, SLEEPER_API, BASE_PATH } from './config'
export { USER_ID_TO_OWNER, DISPLAY_NAME_TO_OWNER, OWNER_COLORS, OWNER_FULL_NAMES, POS_COLORS, POS_TEXT_CLASSES, POS_BADGE_CLASSES } from './owner-map'
export { MANUAL_CHAMPS, MANUAL_SHAME, MANUAL_PLAYOFF_OVERRIDES, BUY_INS, EXCLUDED_GAME_SCORES, NEXT_DRAFT_DATE } from './league-history'
export { EARNINGS_DATA } from './earnings-data'
export { TRASH_TALK } from './narratives'
