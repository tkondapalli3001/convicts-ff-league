> **Global instructions apply first.** Before working on this project, read the global CLAUDE.md (About Me system: about-me.md, writingrules.md, memory.md). Then read this file for project-specific context, and `memory.md` in this folder for current status.

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
  page.tsx                  Home — hero, quick stats, career standings, HOF/Shame
  gamelog/page.tsx          Seasons view — match history, standings, playoff bracket
  records/page.tsx          All-time records, streaks, fun facts, trash talk
  owners/page.tsx           Career leaderboard, earnings ledger, rivalry calculator
  owners/[name]/page.tsx    Individual owner profile (season log, H2H, game log)
  players/page.tsx          NFL player stats — win rate, scoring, ownership, transactions
  seasons/page.tsx          Season trends and charts
  draft/page.tsx            Draft boards, slot analysis, pick order
  transactions/page.tsx     Trades, waivers, free agency history
  layout.tsx                Root layout — wraps app in <LeagueProvider>
  globals.css               Tailwind directives + custom utility classes

components/                 Feature-organized UI components
  gamelog/                  GameLogFilters, GameLogTable, GameDetailModal
  home/                     HeroSection, SearchBar, SeasonStandings, PlayoffBracket
  layout/                   Navbar, MobileNav
  owners/                   OwnerDetail, CareerLeaderboard, H2HGrid, H2HModal
  records/                  ScoreLeaderboard, StreakList, FunFacts, RivalryCalc
  players/                  PlayerWinRateTable, PlayerScoringTable, PlayerCardModal, etc.
  draft/                    Draft boards and tables
  transactions/             TransactionTable, TransactionFilters, TransactionDetailModal
  seasons/                  Season cards and charts
  shared/                   Reusable primitives: StatBox, OwnerAvatar, FinishBadge, etc.
  trends/                   AvgScoreChart, FinishTracker, TrashTalkCard
  earnings/                 AnnualBreakdown

context/
  LeagueContext.tsx         Global state — orchestrates all Sleeper API fetching and
                            post-processing; exposes useLeague() hook

hooks/
  useCareerStats.ts         Memoized wrapper for lib/stats buildCareerStats()
  useRecordsData.ts         Memoized wrapper for lib/stats computeRecords()
  usePlayersData.ts         NFL player stats (lazy players-cache fetch)
  useTransactionsData.ts    Transaction history (lazy fetch, module cache)
  useFunFacts.ts            Narrative stats for the records page

lib/                        Business logic and static data
  config.ts                 LEAGUE_ID, SLEEPER_API base URL
  owner-map.ts              USER_ID_TO_OWNER, DISPLAY_NAME_TO_OWNER, OWNER_COLORS
  league-history.ts         MANUAL_CHAMPS, MANUAL_SHAME, MANUAL_PLAYOFF_OVERRIDES,
                            BUY_INS, EXCLUDED_GAME_SCORES
  earnings-data.ts          EARNINGS_DATA (all-time payouts per owner per year)
  narratives.ts             TRASH_TALK (flavor text per owner)
  constants.ts              Barrel — re-exports all of the above (use this for imports)
  sleeper-api.ts            Sleeper API fetch wrappers (sleepFetch, buildLeagueChain, etc.)
  players-cache.ts          Lazy-loaded Sleeper player metadata cache
  stock-picks.ts            Stock-picks side-game data
  stats/                    Shared stat engine — pure functions, single source of truth
    game-filters.ts         gameKey(), consolation/champ-path key sets, manual exclusions
    career.ts               buildCareerStats(), championshipCount(), activeOwnerNames()
    h2h.ts                  h2hRecord(), h2hVsAll()
    records.ts              computeRecords() — record-book extremes and streaks
    index.ts                Barrel re-export (import from '@/lib/stats')
  data-processing/          Data transformation layer
    resolve-owner.ts        resolveOwnerName() — user_id/display_name → canonical name
    bracket-finish.ts       getFinishFromBracket() — bracket game → placement (1st, 2nd…)
    build-matchups.ts       buildFlatMatchups() — raw API data → flat Matchup[]
    build-seasons.ts        buildOwnerSeasons() — matchups → per-owner OwnerSeason[]
    player-stats.ts         computePlayerWinRates(), computePlayerScores()
    build-draft-stats.ts    computeDraftOwnership() and draft aggregations
    index.ts                Barrel re-export
  data-processing.ts        Barrel — re-exports from data-processing/ (use this for imports)
  luck.ts                   computeLuckIndex() — expected wins vs actual wins
  utils.ts                  ownerColor(), fmtPts(), getChampion(), getShameLoser(), etc.

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
- **Import from barrels, not sub-files.** Always `import from '@/lib/constants'`, `import from '@/lib/data-processing'`, and `import from '@/lib/stats'` — not from the individual files underneath. This keeps import paths stable across future reorganizations.
- **Stat math lives in `lib/stats/`.** Career records, championship counts, H2H records, and record-book extremes have one implementation each. Never recompute them inline in a component — half-titles (0.5), shared-winner substring matching, and tie-as-win rules are easy to get subtly wrong.
- **Pages are thin shells.** Computation belongs in `hooks/` or `lib/`. Pages should only call hooks, destructure results, and render JSX.

---

## UI & Design System (Statmuse × Sleeper)

- **Theme:** Dark mode only. Custom Tailwind `s-` color palette defined in `tailwind.config.ts`.
- **Key colors:** `s-bg` (#080c14) backgrounds, `s-gold` accents, `s-green`/`s-red` for win/loss, `s-text` / `s-text3` for hierarchy. Position colors come from `POS_COLORS` / `POS_TEXT_CLASSES` / `POS_BADGE_CLASSES` in `lib/constants` — never redefine them locally.
- **Card/rounding tokens:** cards use `.bento-card` / `.gl` (16px radius, defined in globals.css), inner panels `rounded-[10px]`, pills `rounded-full`, tab buttons `rounded-[8px]`.
- **Shared primitives:** `PageHeader` (page title + subtitle), `PillTabs` (gold tab row), `StatChip` (hero number card), `StatBox`, `OwnerAvatar`, `FinishBadge`, `WinPctBadge`. Use these instead of re-rolling the markup.
- **Layout:** High-contrast tables, borderless rounded cards, hero typography for key numbers. Keyboard focus rings come from a global `:focus-visible` rule.
- **No CSS modules or styled-components** — pure Tailwind utility classes in JSX. Inline styles only for dynamic values (e.g., percentage widths, owner hex colors).

---

## Development Rules

- **Naming:** `kebab-case` for files, `camelCase` for variables/functions, `PascalCase` for components.
- **No regressions:** Never remove functionality or alter visual styling unless explicitly instructed.
- **No unnecessary abstractions:** Don't add hooks, utilities, or components that aren't called for by the task.
- **useMemo for heavy transforms:** Any computation over `allMatchups` (1000+ entries) or `ownerSeasons` should be wrapped in `useMemo`.
- **Run `npm run build` after any structural change** to catch TypeScript errors before committing.
