# CLAUDE.md — Convicts FF League

## Project Essence
A data-heavy historical archive for a 7-season Sleeper Fantasy Football league. Goal: a professional sports analytics platform in the style of Statmuse × Sleeper — dark mode, high-density tables, hero typography. This is a "source of truth" for league history, not a generic fantasy app.

**Never remove features or change the visual theme unless explicitly directed.**

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 — App Router, static export (`output: 'export'`) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS — custom `s-` dark palette (see `tailwind.config.ts`) |
| State | React Context (`LeagueContext`) — all data loaded once on mount |
| Data | Sleeper API — direct client-side fetch, no backend |
| Charts | Recharts |
| Deploy | GitHub Pages via `.github/workflows/deploy.yml`, `basePath: /convicts-ff-league` |

---

## Directory Structure

```
app/                        Next.js App Router pages (thin render shells only)
  page.tsx                  Home — standings, playoff bracket, trophies
  gamelog/page.tsx          Full match history with lineup detail modal
  records/page.tsx          All-time records and streaks
  luck/page.tsx             Luck index (expected vs actual wins)
  earnings/page.tsx         All-time earnings leaderboard
  trends/page.tsx           Season trends and charts
  owners/page.tsx           Career leaderboard
  owners/[name]/page.tsx    Individual owner profile
  layout.tsx                Root layout — wraps app in <LeagueProvider>
  globals.css               Tailwind directives + custom utility classes

components/                 Feature-organized UI components
  gamelog/                  GameLogFilters, GameLogTable, GameDetailModal
  home/                     PlayoffBracket, SeasonStandings, TrophySection, QuickStats
  layout/                   Navbar, MobileNav
  luck/                     LuckTable
  owners/                   OwnerDetail, CareerLeaderboard, H2HGrid, H2HModal, OwnerCard
  records/                  ScoreLeaderboard, StreakList
  shared/                   Reusable primitives: StatBox, OwnerAvatar, FinishBadge, etc.
  trends/                   AvgScoreChart, FinishTracker, TrashTalkCard
  earnings/                 AnnualBreakdown, EarningsBars

context/
  LeagueContext.tsx         Global state — orchestrates all Sleeper API fetching and
                            post-processing; exposes useLeague() hook

hooks/
  useRecordsData.ts         Derived record computations (streaks, extremes, rivalries)

lib/                        Business logic and static data
  config.ts                 LEAGUE_ID, SLEEPER_API base URL
  owner-map.ts              USER_ID_TO_OWNER, DISPLAY_NAME_TO_OWNER, OWNER_COLORS
  league-history.ts         MANUAL_CHAMPS, MANUAL_SHAME, MANUAL_PLAYOFF_OVERRIDES, BUY_INS
  earnings-data.ts          EARNINGS_DATA (all-time payouts per owner per year)
  narratives.ts             TRASH_TALK (flavor text per owner)
  constants.ts              Barrel — re-exports all of the above (use this for imports)
  sleeper-api.ts            Sleeper API fetch wrappers (sleepFetch, buildLeagueChain, etc.)
  data-processing/          Data transformation layer
    resolve-owner.ts        resolveOwnerName() — user_id/display_name → canonical name
    bracket-finish.ts       getFinishFromBracket() — bracket game → placement (1st, 2nd…)
    build-matchups.ts       buildFlatMatchups() — raw API data → flat Matchup[]
    build-seasons.ts        buildOwnerSeasons() — matchups → per-owner OwnerSeason[]
    index.ts                Barrel re-export
  data-processing.ts        Barrel — re-exports from data-processing/ (use this for imports)
  luck.ts                   computeLuckIndex() — expected wins vs actual wins
  utils.ts                  ownerColor(), fmtPts(), fmtPct(), fmtMoney(), sortBy(), etc.

types/
  index.ts                  All TypeScript interfaces — Sleeper API types + processed types

scripts/
  luck-index.mjs            Standalone Node.js utility (not part of the build)
```

---

## Data Flow

```
Sleeper API
  ↓
lib/sleeper-api.ts          fetch wrappers (buildLeagueChain, fetchMatchupsForWeek, etc.)
  ↓
context/LeagueContext.tsx   orchestrates fetching for all seasons in parallel
  ↓
lib/data-processing/        transforms raw API responses into normalized state
  ↓
LeagueState (React Context) single global store, loaded once, never refetched
  ↓
useLeague() in pages/components
```

All data is **client-side only** — no SSR, no API routes, no server components.

---

## Key Invariants

- **Name resolution is the linchpin.** Sleeper usernames change; canonical owner first names don't. Always use `resolveOwnerName()` or the `rosterUserMaps[year]` lookup. The mappings live in `lib/owner-map.ts`.
- **Manual overrides exist for a reason.** `MANUAL_CHAMPS`, `MANUAL_SHAME`, and `MANUAL_PLAYOFF_OVERRIDES` in `lib/league-history.ts` correct Sleeper bracket data that is incomplete or wrong for specific seasons. Do not remove them.
- **Import from barrels, not sub-files.** Always `import from '@/lib/constants'` and `import from '@/lib/data-processing'` — not from the individual files underneath. This keeps import paths stable across future reorganizations.
- **Pages are thin shells.** Computation belongs in `hooks/` or `lib/`. Pages should only call hooks, destructure results, and render JSX.

---

## UI & Design System (Statmuse × Sleeper)

- **Theme:** Dark mode only. Custom Tailwind `s-` color palette defined in `tailwind.config.ts`.
- **Key colors:** `s-bg` (#080c14) backgrounds, `s-gold` accents, `s-green`/`s-red` for win/loss, `s-text` / `s-text3` for hierarchy.
- **Layout:** High-contrast tables, borderless rounded cards, hero typography for key numbers.
- **No CSS modules or styled-components** — pure Tailwind utility classes in JSX. Inline styles only for dynamic values (e.g., percentage widths, owner hex colors).

---

## Development Rules

- **Naming:** `kebab-case` for files, `camelCase` for variables/functions, `PascalCase` for components.
- **No regressions:** Never remove functionality or alter visual styling unless explicitly instructed.
- **No unnecessary abstractions:** Don't add hooks, utilities, or components that aren't called for by the task.
- **useMemo for heavy transforms:** Any computation over `allMatchups` (1000+ entries) or `ownerSeasons` should be wrapped in `useMemo`.
- **Run `npm run build` after any structural change** to catch TypeScript errors before committing.
