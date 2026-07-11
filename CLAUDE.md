> **Global instructions apply first.** Before working on this project, read the global CLAUDE.md (About Me system: about-me.md, writingrules.md, memory.md). Then read this file for project-specific context, and `memory.md` in this folder for current status.

# CLAUDE.md — Convicts FF League

## Project Essence
A data-heavy archive and live-season companion for a 7-season Sleeper Fantasy Football league. Goal: a professional sports-analytics archive with a **Midnight Prime** "trophy-room luxury" look — cinematic onyx backgrounds, metallic-gold hairlines, condensed uppercase display numerals, high-density tables, editorial restraint. Source of truth for league history, plus weekly matchup previews during the season.

**Never remove features or change the visual theme unless explicitly directed.** See `DESIGN.md` for the full Midnight Prime design system and architecture reference.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 — App Router, static export (`output: 'export'`) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS — Midnight Prime onyx/gold palette: `gold*` + legacy `s-` tokens (see `tailwind.config.ts`) |
| State | React Context (`LeagueContext`) — all data loaded once on mount |
| Data | Static season snapshots (`public/data/`) + Sleeper API for the live season — client-side, no backend |
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
  this-week/page.tsx        Weekly matchup previews — projections, implications, smack talk
  draft/page.tsx            Draft boards, slot analysis, pick order
  transactions/page.tsx     Trades, waivers, free agency history
  layout.tsx                Root layout — wraps app in <LeagueProvider>; site metadata/PWA
  icon.png, apple-icon.png  Favicon + apple-touch icon (Next file conventions)
  globals.css               Tailwind directives + custom utility classes

components/                 Feature-organized UI components
  gamelog/                  GameLogFilters, GameLogTable, GameDetailModal
  home/                     HeroSection, SeasonStandings, PlayoffBracket, career cards
  layout/                   Navbar, MobileMenu (hamburger drawer), Brand (monogram +
                            wordmark), SearchStrip (home search bar), Footer, nav-items.ts
  search/                   GlobalSearch (⌘K trigger), SearchOverlay, AnswerCard,
                            ManagerCard, PlayerCard
  preview/                  MatchupRow + MatchupModal (This Week tab — clickable rows → H2H popup)
  owners/                   OwnerDetail, CareerLeaderboard, H2HGrid, H2HModal
  records/                  ScoreLeaderboard, StreakList, FunFacts, RivalryCalc
  players/                  PlayerWinRateTable, PlayerScoringTable, PlayerCardModal, etc.
  draft/                    Draft boards and tables
  transactions/             TransactionTable, TransactionFilters, TransactionDetailModal
  seasons/                  Season cards and charts
  shared/                   Reusable primitives: PageHeader (kicker + gradient title),
                            PillTabs (underline tabs), SectionCard (onyx + gold-dash header),
                            StatChip (stat-band cell), RecordItem, OwnerAvatar,
                            PlayerHeadshot, FinishBadge, WinPctBadge, etc.
  trends/                   AvgScoreChart, FinishTracker, TrashTalkCard
  earnings/                 AnnualBreakdown

context/
  LeagueContext.tsx         Global state — orchestrates all Sleeper API fetching and
                            post-processing; exposes useLeague() hook

hooks/
  useCareerStats.ts         Memoized wrapper for lib/stats buildCareerStats()
  useRecordsData.ts         Memoized wrapper for lib/stats computeRecords()
  usePlayersData.ts         NFL player stats (lazy players-cache fetch; picks from state)
  usePreviewData.ts         This Week previews (lib/preview + projections fetch)
  useTransactionsData.ts    Transaction history (snapshot-first, live current season)
  useFunFacts.ts            Narrative stats for the records page

lib/                        Business logic and static data
  config.ts                 LEAGUE_ID, SLEEPER_API base URL, BASE_PATH
  owner-map.ts              USER_ID_TO_OWNER, DISPLAY_NAME_TO_OWNER, OWNER_COLORS
  league-history.ts         MANUAL_CHAMPS, MANUAL_SHAME, MANUAL_PLAYOFF_OVERRIDES,
                            BUY_INS, EXCLUDED_GAME_SCORES
  earnings-data.ts          EARNINGS_DATA (all-time payouts per owner per year)
  narratives.ts             TRASH_TALK (flavor text per owner)
  constants.ts              Barrel — re-exports all of the above (use this for imports)
  sleeper-api.ts            Sleeper API fetch wrappers (sleepFetch, per-season fetchers)
  history-snapshot.ts       Loads public/data/season-*.json (cached; null on any failure)
  players-cache.ts          Lazy-loaded Sleeper player metadata cache
  stock-picks.ts            Stock-picks side-game data
  stats/                    Shared stat engine — pure functions, single source of truth
    game-filters.ts         gameKey(), consolation/champ-path key sets, manual exclusions
    career.ts               buildCareerStats(), championshipCount(), activeOwnerNames()
    h2h.ts                  h2hRecord(), h2hVsAll()
    records.ts              computeRecords() — record-book extremes and streaks
    index.ts                Barrel re-export (import from '@/lib/stats')
  search/                   "Ask anything" query engine — no LLM, no API keys
    tokenize.ts             normalize(), tokens(), extractYear(), levenshtein()
    entities.ts             buildEntityIndex(), matchOwners(), matchPlayer()
    parse.ts                parseQuery() — regex intent table (13 intents)
    resolvers.ts            resolveAnswer() — maps intents onto lib/stats computations
    index.ts                Barrel + answerQuery() (import from '@/lib/search')
  preview/                  This Week engine — pure functions
    build-preview.ts        buildWeekPreviews(), computeStandings(), week selection
    implications.ts         computeImplication() — win/loss seed movement, playoff line
    smack-talk.ts           smackLines() — deterministic template smack talk
    projections.ts          Sleeper projections (UNDOCUMENTED endpoint — degrade gracefully)
    index.ts                Barrel re-export (import from '@/lib/preview')
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

public/
  data/                     Season snapshots (season-<year>.json + manifest.json) —
                            generated by npm run snapshot, committed to the repo
  manifest.json             PWA manifest ("Convicts FF" add-to-home-screen)
  icons/, og-card.png       App icons + social share card

scripts/
  snapshot-history.mjs      npm run snapshot — freezes completed seasons to public/data/
  luck-index.mjs            Standalone Node.js utility (not part of the build)
```

---

## Data Flow

```
public/data/season-*.json   completed seasons, static (zero API calls)
        +
Sleeper API                 only seasons missing from the snapshot (the live one)
  ↓
context/LeagueContext.tsx   loads snapshot, walks the live chain, merges
  ↓
lib/data-processing/        transforms raw API responses into normalized state
  ↓
LeagueState (React Context) single global store, loaded once, never refetched
  ↓
useLeague() in pages/components
```

All data is **client-side only** — no SSR, no API routes, no server components.

**Yearly ritual:** after the draft, point `LEAGUE_ID` (lib/config.ts) at the new
season; after a season completes, run `npm run snapshot` and commit `public/data/`.

---

## Key Invariants

- **Name resolution is the linchpin.** Sleeper usernames change; canonical owner first names don't. Always use `resolveOwnerName()` or the `rosterUserMaps[year]` lookup. The mappings live in `lib/owner-map.ts`.
- **Manual overrides exist for a reason.** `MANUAL_CHAMPS`, `MANUAL_SHAME`, and `MANUAL_PLAYOFF_OVERRIDES` in `lib/league-history.ts` correct Sleeper bracket data that is incomplete or wrong for specific seasons. Do not remove them.
- **Import from barrels, not sub-files.** Always `import from '@/lib/constants'`, `'@/lib/data-processing'`, `'@/lib/stats'`, `'@/lib/search'`, and `'@/lib/preview'` — not from the individual files underneath. This keeps import paths stable across future reorganizations.
- **Stat math lives in `lib/stats/`.** Career records, championship counts, H2H records, and record-book extremes have one implementation each. Never recompute them inline in a component — half-titles (0.5), shared-winner substring matching, and tie-as-win rules are easy to get subtly wrong.
- **The snapshot is an accelerator, never a dependency.** If `public/data/manifest.json` fails to load, `LeagueContext` must fall back to full live fetching. Don't break that path.
- **Projections degrade gracefully.** `lib/preview/projections.ts` hits an undocumented Sleeper endpoint; every failure returns null and preview cards render without the projection row. Never let a projections change break the This Week page.
- **The search overlay is portaled to `document.body`.** The navbar's `backdrop-filter` makes it the containing block for fixed descendants — rendering the overlay inside the nav clips it. Don't move it back.
- **Pages are thin shells.** Computation belongs in `hooks/` or `lib/`. Pages should only call hooks, destructure results, and render JSX.

---

## UI & Design System (Midnight Prime)

"Trophy-room luxury": cinematic onyx surfaces, metallic-gold hairlines, condensed uppercase
display numerals, editorial restraint. **No glassmorphism, blur-on-cards, orb glows, or large
rounded corners.** Full spec + canonical patterns live in `DESIGN.md`.

- **Theme:** Dark mode only. Tokens in `tailwind.config.ts`: precise `gold` / `gold-soft` / `gold-dim` / `gold-bright`, `panel` / `panel-2`, `win` / `loss`, plus the legacy `s-` palette **remapped onto Midnight Prime** (e.g. `s-bg` = onyx `#050506`, `s-text` = warm off-white `#EDE9E0`, `s-green`/`s-red` = sage/brick) so un-migrated markup shifts with the theme.
- **Key colors:** page `#050506`, nav `#070708`, cards `#0B0B0D`; gold `#C9962E` (hairlines/active underline), `#E8CE8A` (emphasized values), text `#EDE9E0`→`#9AA0AC`→`#5C6270`; sage `#7FA886` win / brick `#B4636B` loss. Gold hairlines = `rgba(var(--gold-rgb),0.08–0.20)`; hover wash = `rgba(var(--gold2-rgb),0.04–0.05)` (RGB tuples in `globals.css`). Position colors (`POS_COLORS` / `POS_TEXT_CLASSES` / `POS_BADGE_CLASSES`) and `OWNER_COLORS` are **functional palettes in `lib/owner-map.ts` — never theme-swap or redefine them locally.**
- **Typography:** `Barlow Condensed` (display/numerals — all big numbers, names, titles, table numerals; uppercase, tight leading) + `Archivo` (UI/body; tiny uppercase tracked labels). Loaded via `next/font` in `layout.tsx` as `--font-barlow` / `--font-archivo`; use `font-display` for Barlow. **Inter is gone.**
- **Shape tokens:** cards `6px` radius via `.gl` / `.bento-card` (onyx + 1px gold hairline, no blur), chips/badges square or `2px`, pills `rounded-full`, avatars `50%`. Depth comes from borders + background steps, not shadows.
- **Shared primitives:** `PageHeader` (gold-dash kicker + hero-gradient title), `PillTabs` (gold-underline tabs), `SectionCard` (onyx card + gold/brick dash header), `StatChip` (hairline stat-band cell), `RecordItem`, `OwnerAvatar` (gold-ring for champions), `PlayerHeadshot`, `FinishBadge` (square chip), `WinPctBadge`. Use these instead of re-rolling the markup.
- **Motion (respect `prefers-reduced-motion`):** `animate-gold-pulse` on hero names, `animate-fade-in*` staggered entrances. Global `:focus-visible` gold ring.
- **No CSS modules or styled-components** — pure Tailwind utility classes in JSX. Inline styles only for dynamic values (percentage widths, owner hex colors, variable-alpha gold via the RGB tuples).

---

## Development Rules

- **Naming:** `kebab-case` for files, `camelCase` for variables/functions, `PascalCase` for components.
- **No regressions:** Never remove functionality or alter visual styling unless explicitly instructed.
- **No unnecessary abstractions:** Don't add hooks, utilities, or components that aren't called for by the task.
- **useMemo for heavy transforms:** Any computation over `allMatchups` (1000+ entries) or `ownerSeasons` should be wrapped in `useMemo`.
- **Run `npm run build` after any structural change** to catch TypeScript errors before committing.
