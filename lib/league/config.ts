// The current season's league — the chain walks backward via previous_league_id
// to find every prior season
export const LEAGUE_ID = '1367670546694705152'
/** The season LEAGUE_ID belongs to: the season tab's label and URL (/2026). */
export const CURRENT_SEASON = 2026
/** The deployed site, for preview cards. */
export const SITE_URL = 'https://tkondapalli3001.github.io/convicts-ff-league'
export const SLEEPER_API = 'https://api.sleeper.app/v1'
// Mirrors basePath in next.config.js (applies in dev too) — used for fetching
// static assets like the season snapshot files in public/data/
export const BASE_PATH = '/convicts-ff-league'
