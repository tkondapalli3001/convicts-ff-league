> **Global instructions apply first.** Before working on this project, read the global CLAUDE.md (About Me system: about-me.md, writingrules.md, memory.md). Then read this file for project-specific context.

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
  records/page.tsx          All-time records, streaks, fun facts, trash talk
  owners/page.tsx           Career leaderboard, earnings ledger, rivalry calculator
  owners/[name]/page.tsx    Individual owner profile (season log, H2H, game log)
  players/page.tsx          NFL player stats — win rate, scoring, ownership, transactions
  seasons/page.tsx          Standings + playoff bracket, Game Log (every game + box scores),
                            finish tracker, scoring trend
  2026/page.tsx             Current-season hub (nav label = the year) — Power Rankings (lands
                            here), Matchups (Matchup of the Week, playoff-odds stakes, emoji flair,
                            daily group-chat ammo), Rosters (any week's lineup + season stats +
                            schedule), Transactions, and the Draft board,
                            all synced with Sleeper while open
  this-week/page.tsx        Redirect to /2026 (the tab's old name — keeps shared links alive)
  draft/page.tsx            Draft boards, slot analysis, pick order
  layout.tsx                Root layout — wraps app in <LeagueProvider>; site metadata/PWA
  icon.png, apple-icon.png  Favicon + apple-touch icon (Next file conventions)
  globals.css               Tailwind directives + custom utility classes

components/                 Feature-organized UI components
  gamelog/                  GameLog (Seasons → Game Log tab), GameLogFilters, GameLogTable,
                            GameDetailModal (box score)
  home/                     HeroSection, SeasonStandings, PlayoffBracket, career cards
  layout/                   Navbar, MobileMenu (hamburger drawer), Brand (monogram +
                            wordmark), SearchStrip (home search bar), Footer, nav-items.ts
  search/                   GlobalSearch (⌘K trigger), SearchOverlay, AnswerCard,
                            ManagerCard, PlayerCard
  preview/                  2026 tab: MatchupOfTheWeek (featured card), MatchupRow + MatchupModal
                            (clickable rows → H2H, flair, playoff stakes, rerollable ammo),
                            FlairBadges + FlairLegend, SmackLine, PowerRankingsTable, RosterView
                            (manager picker, season header, lineup table, schedule),
                            SeasonTransactions, SeasonDraftBoard (position-colored), SyncStatus
  owners/                   OwnerDetail, CareerLeaderboard, H2HGrid, H2HModal
  records/                  ScoreLeaderboard, StreakList, FunFacts, RivalryCalc
  players/                  PlayerWinRateTable, PlayerScoringTable, PlayerCardModal, etc.
  draft/                    Draft boards and tables
  transactions/             TransactionTable, TransactionFilters, TransactionDetailModal
                            (Players → Transactions and 2026 → Transactions)
  shared/                   Reusable primitives: PageHeader (kicker + gradient title),
                            PillTabs (underline tabs), SectionCard (onyx + gold-dash header),
                            StatChip (stat-band cell), RecordItem, OwnerAvatar,
                            PlayerHeadshot, FinishBadge, WinPctBadge, SortHeader,
                            InfoTip (? icon → term definition popover), etc.
  trends/                   AvgScoreChart, FinishTracker, TrashTalkCard
  earnings/                 AnnualBreakdown

context/
  LeagueContext.tsx         Global state — orchestrates all Sleeper API fetching and
                            post-processing; exposes useLeague() hook

hooks/
  useCareerStats.ts         Memoized wrapper for lib/stats buildCareerStats()
  useRecordsData.ts         Memoized wrapper for lib/stats computeRecords()
  usePlayersData.ts         NFL player stats (player names from lib/players-cache; picks from state)
  useLiveSeason.ts          2026 tab's live sync — polls Sleeper, overlays the global state
  usePreviewData.ts         2026 → Matchups: previews + playoff stakes + flair + Matchup of the
                            Week + daily ammo (lib/preview, fed by useLiveSeason; loads the rest of
                            the schedule once for the odds)
  usePowerRankings.ts       2026 → Power Rankings + streak/honors flair (lib/stats computePowerRankings)
  useTeamRosters.ts         2026 → Rosters: any week's lineups, season stats (league scoring),
                            owner headers (PR · record · all-play · PF · PA) and schedules
  useSeasonSchedule.ts      2026 tab's full regular-season schedule (loads the unplayed weeks once)
  useSeasonTransactions.ts  2026 → Transactions: every move this season (past weeks once, the
                            current week via the live sync)
  useModalClose.ts          Escape-to-close + body scroll lock shared by every modal
  useTransactionsData.ts    Transaction history (lazy transactions-<year>.json, live current season)
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
  history-snapshot.ts       Loads public/data/ files — seasons, lazy transactions, player index
                            (cached; null on any failure)
  players-cache.ts          getPlayersCache() — player names from the ~40 KB public/data/players.json
                            index; Sleeper's ~15 MB dump only if the index is missing
  stock-picks.ts            Stock-picks side-game data
  stats/                    Shared stat engine — pure functions, single source of truth
    game-filters.ts         gameKey(), consolation/champ-path key sets, manual exclusions
    career.ts               buildCareerStats(), championshipCount(), activeOwnerNames()
    h2h.ts                  h2hRecord(), h2hVsAll()
    records.ts              computeRecords() — record-book extremes and streaks
    power-rankings.ts       computePowerRankings() — Oberon Mt. power rating (actual win%),
                            movement, all-play record, PF/PA, streaks; seasonRanks()
    luck.ts                 computeLuckIndex(), allPlayRecords() — the ONLY luck/all-play math
                            (Seasons, Records, search, 2026 tab, scripts/luck-index.mjs)
    index.ts                Barrel re-export (import from '@/lib/stats')
  search/                   "Ask anything" query engine — no LLM, no API keys
    tokenize.ts             normalize(), tokens(), extractYear(), levenshtein()
    entities.ts             buildEntityIndex(), matchOwners(), matchPlayer()
    parse.ts                parseQuery() — regex intent table (16 intents)
    resolvers.ts            resolveAnswer() — maps intents onto lib/stats computations
    index.ts                Barrel + answerQuery() (import from '@/lib/search')
  preview/                  2026 tab engine — pure functions plus the live-season fetchers
    build-preview.ts        buildWeekPreviews(), computeStandings(), week selection
    stakes.ts               weekStakes() — each team's playoff odds (win/loss) + exact clinch/
                            elimination sentences; formatOdds(), ordinal()
    schedule.ts             seasonSchedule(), scheduleGaps(), ownerSchedule() — every week's
                            pairings; one owner's results, running record, high/low
    season-stats.ts         loadSeasonStats() — every player's season FPTS/GP/positional rank,
                            scored with league settings (UNDOCUMENTED endpoint — degrade gracefully)
    playoff-odds.ts         simulatePlayoffOdds() — seeded 10,000-season simulation;
                            fitScoringModel() learns weekly swing + regression from history
    playoff-scenarios.ts    playoffScenarios() — exact clinch/elimination conditions (every
                            outcome enumerated late in the season; ties in wins never count)
    smack-talk.ts           smackFacts()/smackPool() — template ammo from ~25 fact types, phrasing
                            and order seeded by matchup + date (rotates daily, stable intraday)
    facts.ts                Season facts shared by flair, ammo, and MOTW — daddyOf() (75%+ over
                            5+ meetings), seasonHonors(), lineupRegrets(), injuryReport(), …
    flair.ts                matchupBadges()/standingBadges() — 💦 🔥 🧊 👑 🏆 🚽 🚑 rules
    matchup-of-the-week.ts  pickMatchupOfTheWeek() — scores playoff stakes, action, and history
    projections.ts          Sleeper projections + player names/injuries/opponents, scored with
                            league settings (UNDOCUMENTED endpoint — degrade gracefully)
    live.ts                 syncLiveSeason() polling pass, withLiveSeason() overlay,
                            weekStatus() final/live/upcoming (from last_scored_leg),
                            loadWeekPairings() for the rest of the schedule
    rosters.ts              buildTeamRosters(), player lookup chain
    index.ts                Barrel re-export (import from '@/lib/preview')
  data-processing/          Data transformation layer
    resolve-owner.ts        resolveOwnerName() — user_id/display_name → canonical name
    bracket-finish.ts       getFinishFromBracket() — bracket game → placement (1st, 2nd…)
    build-matchups.ts       buildFlatMatchups() — raw API data → flat Matchup[]
    build-seasons.ts        buildOwnerSeasons() — matchups → per-owner OwnerSeason[]
    player-stats.ts         computePlayerWinRates(), computePlayerScores()
    build-draft-stats.ts    computeDraftOwnership() and draft aggregations
    draft-board.ts          buildDraftBoard() — rounds × slots grid with pre-trade slot owners
    index.ts                Barrel re-export
  data-processing.ts        Barrel — re-exports from data-processing/ (use this for imports)
  utils.ts                  ownerColor(), fmtPts(), getChampion(), getShameLoser(), etc.

types/
  index.ts                  All TypeScript interfaces — Sleeper API types + processed types

public/
  data/                     Generated by npm run snapshot, committed to the repo:
                            season-<year>.json (loaded on every visit), transactions-<year>.json
                            (lazy, Players → Transactions only), players.json (name index),
                            manifest.json
  manifest.json             PWA manifest ("Convicts FF" add-to-home-screen)
  icons/, og-card.png       App icons + social share card

scripts/
  snapshot-history.mjs      npm run snapshot — freezes completed seasons to public/data/;
                            `-- --players-only` rebuilds just players.json
  luck-index.mjs            node scripts/luck-index.mjs <leagueId> — any league's luck index,
                            run through lib/stats/luck.ts itself (Node 22.18+ type stripping)
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

2026 tab only:  useLiveSeason() polls the live season (matchups 1 min, league/rosters/
                moves 5 min, projections 10 min) and overlays it on a copy of LeagueState
```

All data is **client-side only** — no SSR, no API routes, no server components.

**Yearly ritual:** after the draft, point `LEAGUE_ID` (lib/config.ts) at the new
season, rename the season tab (`git mv app/2026 app/2027`, plus its href/label in
`components/layout/nav-items.ts`), and run `npm run snapshot -- --players-only` so
rookies have names; after a season completes, run `npm run snapshot` and commit
`public/data/`.

---

## Key Invariants

- **Name resolution is the linchpin.** Sleeper usernames change; canonical owner first names don't. Always use `resolveOwnerName()` or the `rosterUserMaps[year]` lookup. The mappings live in `lib/owner-map.ts`.
- **Manual overrides exist for a reason.** `MANUAL_CHAMPS`, `MANUAL_SHAME`, and `MANUAL_PLAYOFF_OVERRIDES` in `lib/league-history.ts` correct Sleeper bracket data that is incomplete or wrong for specific seasons. Do not remove them.
- **Import from barrels, not sub-files.** Always `import from '@/lib/constants'`, `'@/lib/data-processing'`, `'@/lib/stats'`, `'@/lib/search'`, and `'@/lib/preview'` — not from the individual files underneath. This keeps import paths stable across future reorganizations.
- **Stat math lives in `lib/stats/`.** Career records, championship counts, H2H records, and record-book extremes have one implementation each. Never recompute them inline in a component — half-titles (0.5), shared-winner substring matching, and tie-as-win rules are easy to get subtly wrong.
- **The snapshot is an accelerator, never a dependency.** If `public/data/manifest.json` fails to load, `LeagueContext` must fall back to full live fetching. Don't break that path.
- **Projections degrade gracefully.** `lib/preview/projections.ts` and `season-stats.ts` hit undocumented Sleeper endpoints; every failure returns null and the 2026 tab renders without projections or season stats (dashes; roster names fall back to the player index). Never let either break the 2026 page. Season FPTS are Sleeper's season totals × the league's `scoring_settings` — that matches the points Sleeper credits rostered players to the cent, so don't swap in Sleeper's preset `pts_half_ppr`.
- **Flair and ammo are true stats, never invented.** Every badge, ammo line, and Matchup of the Week reason comes from `lib/preview/facts.ts`, the stat engine, or the stakes engine. Only championship-path games (`buildChampPathGameKeys`) count as playoff eliminations — a consolation or toilet-bowl game is never billed as one.
- **Stakes account for every other game.** Never claim a result "climbs to 3rd" or "clinches" from one game alone. Playoff odds are simulations and always labeled as odds (`lib/preview/playoff-odds.ts`); clinch/elimination sentences are exact (`playoff-scenarios.ts`) — true in every outcome, with a tie in wins never counted for or against a team (points for can't be known ahead). If any remaining week's pairings are missing, show no stakes rather than simulate a partial schedule.
- **One luck formula.** Luck Index = actual wins (ties ½) − Σ weekly all-play expected wins ((teams outscored + ½ tied) / (teams that played − 1)), regular season only. It lives only in `lib/stats/luck.ts` — never recompute luck or all-play inline.
- **The power rating is the original Oberon Mt. formula.** `0.6 × avg + 0.2 × (high + low) + 0.2 × (win% × 200)` with the actual record's win%. The league tried all-play win% in its place and went back (2026-10-01) — keep the original unless the owner asks again. All-play stays a display column.
- **Live data overlays; it never mutates.** Only the 2026 tab polls, via `useLiveSeason`, which layers fresh league/roster/matchup data over a copy of the global state (`withLiveSeason`). The global store still loads once. A week is final only once `settings.last_scored_leg` reaches it — never infer "final" from points on the board (a Thursday game puts points up for the whole week).
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
- **Shared primitives:** `PageHeader` (gold-dash kicker + hero-gradient title), `PillTabs` (gold-underline tabs), `SectionCard` (onyx card + gold/brick dash header), `StatChip` (hairline stat-band cell), `RecordItem`, `OwnerAvatar` (gold-ring for champions), `PlayerHeadshot`, `FinishBadge` (square chip), `WinPctBadge`, `SortHeader` (sortable `<th>` — never define header components inside a table's render; its `tip` adds a definition), `InfoTip` (? icon whose definition pops up on hover/tap; portaled so table scrollers can't clip it). Use these instead of re-rolling the markup.
- **Mobile first — most of the league is on phones.** No text under 9px; tap targets ≥ ~28px (`InfoTip` pads its 13px icon, schedule rows are whole-row buttons); form fields 16px on phones (iOS zooms into anything smaller); let names and context lines wrap instead of truncating when they carry the information. Check every page at 375px.
- **Definitions go behind a ?, legends stay footnotes.** Any text that defines a term or a stat (a column, a card's criteria, a formula) is an `InfoTip` beside the term — never a footnote or caption. Emoji legends (`FlairLegend`) stay as visible footnotes; instructions ("Tap a matchup…") stay as text.
- **No HTML entities in multi-line JSX text.** SWC drops the leading space of a line-ending text run that contains one (`all {n} teams … doesn&apos;t count` rendered "all 9teams"). Write a literal ’ or end the run on the same line.
- **Motion (respect `prefers-reduced-motion`):** `animate-gold-pulse` on hero names, `animate-fade-in*` staggered entrances. Global `:focus-visible` gold ring.
- **No CSS modules or styled-components** — pure Tailwind utility classes in JSX. Inline styles only for dynamic values (percentage widths, owner hex colors, variable-alpha gold via the RGB tuples).

---

## Development Rules

- **Naming:** `kebab-case` for files, `camelCase` for variables/functions, `PascalCase` for components.
- **No regressions:** Never remove functionality or alter visual styling unless explicitly instructed.
- **No unnecessary abstractions:** Don't add hooks, utilities, or components that aren't called for by the task.
- **useMemo for heavy transforms:** Any computation over `allMatchups` (1000+ entries) or `ownerSeasons` should be wrapped in `useMemo`.
- **Run `npm run build` after any structural change** to catch TypeScript errors before committing.
