> **Global instructions apply first.** Before working on this project, read the global CLAUDE.md (About Me system: about-me.md, writingrules.md, memory.md). Then read this file for project-specific context.

# CLAUDE.md — Convicts FF League

## Project Essence
A data-heavy archive and live-season companion for a Sleeper Fantasy Football league (2019–present). Goal: a professional sports-analytics archive with a **Midnight Prime** "trophy-room luxury" look — cinematic onyx backgrounds, metallic-gold hairlines, condensed uppercase display numerals, high-density tables, editorial restraint. Source of truth for league history, plus a live hub for the season in progress.

**Never remove features or change the visual theme unless explicitly directed.** See `DESIGN.md` for the full Midnight Prime design system and architecture reference, and `BUILD.md` for project state, the maintenance calendar, and the future waitlist.

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
| Tooling | Vitest (unit tests + tie-outs), ESLint 9, knip (unused files/exports/deps), tsx (runs the dataset script) |
| Deploy | GitHub Pages via `.github/workflows/deploy.yml`, `basePath: /convicts-ff-league` |

---

## Directory Structure

```
app/                        Next.js App Router pages (thin render shells only)
  page.tsx                  Home — hero, quick stats, career standings, HOF/Shame
  [season]/page.tsx         The season tab at /<CURRENT_SEASON> (/2026) — one static page,
                            renders components/current-season/SeasonPage
  owners/page.tsx           Career leaderboard, earnings ledger, rivalry calculator
  owners/[name]/page.tsx    Individual owner profile (season log, H2H, game log)
  seasons/page.tsx          Standings + playoff bracket, Game Log (every game + box scores),
                            finish tracker, scoring trend
  draft/page.tsx            Draft countdown, pick order (stock picks), past boards, slot analysis,
                            steals & busts, draft strategy
  records/page.tsx          Record book, career milestones, streaks, fun facts, trash talk
  players/page.tsx          NFL player stats — win rate, scoring, ownership, transactions
  layout.tsx                Root layout — <LeagueProvider>, site metadata/PWA, fonts
  icon.png, apple-icon.png  Favicon + apple-touch icon (Next file conventions)
  globals.css               Tailwind directives + custom utility classes

components/                 UI, one folder per page plus shared/layout/search
  current-season/           The season tab: SeasonPage (the tab itself), PowerRankingsTable,
                            MatchupOfTheWeek, MatchupRow + MatchupModal, FlairBadges + FlairLegend,
                            SmackLine, RosterView, SeasonTransactions, SeasonDraftBoard, SyncStatus
  home/                     HeroSection, CareerStandingsTable, HallOfFameCard, WallOfShameCard
  seasons/                  SeasonStandings, PlayoffBracket, GameLog (+ Filters, Table,
                            GameDetailModal box score), FinishTracker, AvgScoreChart
  owners/                   OwnerDetail, CareerLeaderboard, AnnualBreakdown (earnings),
                            H2HGrid, H2HModal, RivalryCalc
  draft/                    DraftCountdown, StockStandings, PastDrafts, DraftBoardModal,
                            DraftSlotAnalysis, StealsBusts, DraftStructureTable
  records/                  ScoreLeaderboard, StreakList, FunFacts, TrashTalkCard
  players/                  PlayerWinRateTable, PlayerScoringTable, PlayerOwnershipTable,
                            PlayerCardModal, TradesByYearChart, MostTradedPlayersTable
  transactions/             TransactionTable, TransactionFilters, TransactionDetailModal
                            (Players → Transactions and the season tab's Transactions)
  search/                   GlobalSearch (⌘K trigger), SearchOverlay, SearchStrip (home),
                            AnswerCard, ManagerCard, PlayerCard
  layout/                   Navbar, MobileMenu (hamburger drawer), Brand, Footer, nav-items.ts
  shared/                   Reusable primitives: PageHeader, PillTabs, SectionCard, StatChip,
                            RecordItem, OwnerAvatar, PlayerHeadshot, FinishBadge, WinPctBadge,
                            SortHeader, InfoTip, LoadingSpinner, ErrorState

context/
  LeagueContext.tsx         Global store — loads the snapshot, walks the live league chain,
                            post-processes once; exposes useLeague()

hooks/
  useCareerStats.ts         Memoized buildCareerStats()
  useRecordsData.ts         Memoized computeRecords()
  useFunFacts.ts            Records → Fun Facts cards
  usePlayersData.ts         NFL player stats (names from lib/sources/players)
  useTransactionsData.ts    Players → Transactions: every season's moves (snapshot files for
                            finished seasons, Sleeper for the live one); cached per visit
  useLiveSeason.ts          Season tab's live sync — polls Sleeper, overlays the global store,
                            hands out the season's flattened games and the un-overlaid base store
  usePreviewData.ts         Season tab → Matchups: previews, playoff stakes, flair, Matchup of
                            the Week, daily ammo
  usePowerRankings.ts       Season tab → Power Rankings + streak/honors flair
  useTeamRosters.ts         Season tab → Rosters: any week's lineups, season stats, owner
                            headers (PR · record · all-play · PF · PA), schedules
  useSeasonSchedule.ts      The season's full regular-season schedule (unplayed weeks load once)
  useSeasonTransactions.ts  Season tab → Transactions (past weeks once, current week via the sync)
  useModalClose.ts          Escape-to-close + body scroll lock shared by every modal

lib/
  league/                   Everything hand-maintained about the league (barrel: @/lib/league)
    config.ts               LEAGUE_ID, CURRENT_SEASON, SLEEPER_API, BASE_PATH
    owners.ts               USER_ID_TO_OWNER, DISPLAY_NAME_TO_OWNER, INACTIVE_OWNERS,
                            OWNER_FULL_NAMES, OWNER_COLORS
    history.ts              BUY_INS, NEXT_DRAFT_AT/LABEL, MANUAL_CHAMPS, MANUAL_SHAME,
                            MANUAL_PLAYOFF_OVERRIDES, EXCLUDED_GAME_SCORES
    earnings.ts             EARNINGS_DATA — net per owner per season; totals computed
    stock-picks.ts          STOCK_PICKS, MARKET_BENCHMARK, STOCK_PICK_SEASON (pick-order side game)
    trash-talk.ts           TRASH_TALK cards
  sources/                  Where data comes from (barrel: @/lib/sources)
    sleeper.ts              Sleeper API fetchers (sleepFetch + one per endpoint,
                            fetchTransactionWeeks for several weeks of moves)
    snapshot.ts             public/data/ loaders — manifest, seasons, lazy transactions,
                            player index (cached; null on any failure)
    players.ts              getPlayersCache() — names from the ~40 KB players.json index;
                            Sleeper's ~15 MB dump only if the index is missing
    csv.ts                  csvRecords() — RFC 4180 reader for nflverse and the data/ tables
  positions.ts              POS_COLORS / POS_TEXT_CLASSES / POS_BADGE_CLASSES (functional palettes)
  data-processing/          Raw Sleeper shapes → app shapes (barrel: @/lib/data-processing)
    resolve-owner.ts        resolveOwnerName() — user_id/display_name → canonical name
    season-settings.ts      isSeasonComplete(), playoffStartWeek(), transactionWeeks()
    build-matchups.ts       buildFlatMatchups(), flattenSeasonMatchups() → Matchup[]
    build-seasons.ts        buildOwnerSeasons() → per-owner OwnerSeason[]
    bracket-finish.ts       getFinishFromBracket() — bracket game → placement
    build-draft-stats.ts    player win rates/scores, draft ownership and structure
    draft-slots.ts          draftSlotOwners() — the one "who owned slot N" answer;
                            buildDraftSlotRows() for Slot Analysis
    draft-board.ts          buildDraftBoard() — rounds × slots grid
    transactions.ts         enrichTransaction() — owner + player names on a move
    nflverse.ts             nflverseStatLine() — an nflverse box-score row as a Sleeper stat line
  stats/                    The stat engine — pure functions, single source of truth (@/lib/stats)
    scoring.ts              scoreStats() — a stat line × the league's scoring_settings (projections,
                            season stats, and the nflverse tie-out all score through it)
    lineups.ts              bestLineup(), startingSlots() — the exact best possible lineup; its
                            season totals tie to Sleeper's potential points (ppts)
    control-totals.ts       seasonControlTotals() + KNOWN_GAPS / KNOWN_PLAYER_GAPS — the tie-outs
                            and every documented difference with its cause
    game-filters.ts         gameKey(), consolation/champ-path key sets, manual exclusions
    career.ts               buildCareerStats(), championshipCount(), careerLeaderboard()
                            (Owners → Career Leaderboard), careerMilestones() (Records → Career
                            Milestones)
    owner-profile.ts        ownerProfile() — everything on an owner's profile page: career line,
                            finals, byes, best/worst season and game, top rival, win streak,
                            top scorers, and the Game Log/H2H games
    h2h.ts                  h2hRecord(), h2hVsAll(), daddyOf() + DADDY_WIN_RATE/DADDY_MIN_GAMES
    records.ts              computeRecords() — record-book extremes and streaks
    byes.ts                 playoffByeYears()
    power-rankings.ts       computePowerRankings() — Oberon Mt. power rating, movement,
                            all-play, PF/PA, streaks; seasonRanks()
    luck.ts                 computeLuckIndex(), allPlayRecords() — the ONLY luck/all-play math
                            (also run by scripts/luck-index.mjs)
  current-season/           The season tab's engine (barrel: @/lib/current-season)
    build-preview.ts        buildWeekPreviews(), computeStandings(), season/week selection
    live.ts                 syncLiveSeason() polling pass, withLiveSeason() overlay,
                            weekStatus() final/live/upcoming (from last_scored_leg),
                            loadWeekPairings() for the rest of the schedule
    stakes.ts               weekStakes() — playoff odds (win/loss) + exact clinch/elimination
                            sentences; formatOdds()
    playoff-odds.ts         simulatePlayoffOdds() — seeded 10,000-season simulation;
                            fitScoringModel() learns weekly swing + regression from history
    playoff-scenarios.ts    playoffScenarios() — exact conditions (every outcome enumerated
                            late in the season; ties in wins never count)
    schedule.ts             seasonSchedule(), scheduleGaps(), ownerSchedule()
    season-stats.ts         loadSeasonStats() — season FPTS/GP/positional rank under league
                            scoring (UNDOCUMENTED endpoint — degrade gracefully)
    projections.ts          Sleeper projections, player names/injuries/opponents
                            (UNDOCUMENTED endpoint — degrade gracefully)
    rosters.ts              buildTeamRosters(), player lookup chain
    facts.ts                Season facts shared by flair, ammo, and MOTW — seasonHonors(),
                            lineupRegrets(), injuryReport(), careerWinsBefore(), …
    flair.ts                matchupBadges()/standingBadges() — 💦 🔥 🧊 👑 🏆 🚽 🚑 rules
    smack-talk.ts           smackFacts() — template ammo from ~25 fact types, phrasing and
                            order seeded by matchup + date (rotates daily, stable intraday)
    matchup-of-the-week.ts  pickMatchupOfTheWeek() — scores playoff stakes, action, history
  search/                   "Ask anything" engine — no LLM, no API keys (barrel: @/lib/search)
    tokenize.ts, entities.ts, parse.ts (16 intents), resolvers.ts, types.ts
  utils.ts                  ownerColor(), fullNameInitials(), fmtPts(), fmtMoney(), fmtRecord(),
                            fmtDate(), ordinal(), winPctColor(), timeAgo(), getChampion(), …

types/index.ts              Every shared interface — Sleeper API shapes + processed types

data/                       Tidy history tables (CSV), written by npm run dataset, committed, not
                            deployed: players, owner_weeks, lineups, transactions (failed claims
                            too), draft_picks, projections (with kickoff times), player_weeks
                            (nflverse box scores, rescored), control_totals. data/README.md is
                            the data dictionary

public/
  data/                     Generated by npm run snapshot, committed: season-<year>.json (every
                            visit), transactions-<year>.json (lazy, Players → Transactions),
                            players.json (name index), manifest.json (snapshotted seasons)
  manifest.json             PWA manifest ("Convicts FF" add-to-home-screen)
  icons/, og-card.png       App icons + social share card

scripts/
  build-dataset.ts          npm run dataset — writes data/ from the snapshots, Sleeper's player list
                            and projections, nflverse box scores and schedule, and the DynastyProcess
                            ID crosswalk, through the site's own functions (`-- --cache <dir>`
                            reuses downloads)
  snapshot-history.mjs      npm run snapshot — freezes completed seasons to public/data/;
                            `-- --players-only` rebuilds just players.json. Reads the week
                            rule from lib/data-processing/season-settings.ts (type stripping)
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
useLeague() in hooks → pages/components

Season tab only:  useLiveSeason() polls the live season (matchups 1 min, league/rosters/
                  moves 5 min, projections 10 min) and overlays it on a copy of LeagueState
```

All data is **client-side only** — no SSR, no API routes, no server components beyond static shells.

**Yearly ritual** (full checklist in BUILD.md §3):
- **After the draft:** in `lib/league/config.ts`, point `LEAGUE_ID` at the new season and set `CURRENT_SEASON` to its year — the tab's label and URL follow. Run `npm run snapshot -- --players-only` so rookies have names.
- **After the title game:** run `npm run snapshot`, then `npm run dataset`, and commit `public/data/` and `data/`; add the season to `MANUAL_CHAMPS`/`MANUAL_SHAME` (`lib/league/history.ts`) and each owner's net to `lib/league/earnings.ts` (totals compute themselves). The new season must tie out (see below).

---

## Key Invariants

- **Name resolution is the linchpin.** Sleeper usernames change; canonical owner first names don't. Always use `resolveOwnerName()` or the `rosterUserMaps[year]` lookup. The mappings live in `lib/league/owners.ts`.
- **Manual overrides exist for a reason.** `MANUAL_CHAMPS`, `MANUAL_SHAME`, and `MANUAL_PLAYOFF_OVERRIDES` in `lib/league/history.ts` correct Sleeper bracket data that is incomplete or wrong for specific seasons. Do not remove them.
- **Import from barrels, not sub-files.** `@/lib/league`, `@/lib/sources`, `@/lib/data-processing`, `@/lib/stats`, `@/lib/current-season`, `@/lib/search`, plus the single-file modules `@/lib/positions` and `@/lib/utils`. Files inside a folder import their siblings directly (`./season-settings`). A barrel lists only what the rest of the app imports — knip flags anything else.
- **Stat math lives in `lib/stats/`.** Career records, championship counts, H2H records, the Daddy rule, record-book extremes, career milestones, the career leaderboard, and owner profiles have one implementation each. Never recompute them inline in a component — half-titles (0.5), shared-winner substring matching, and tie-as-win rules are easy to get subtly wrong.
- **One version of each rule.** Playoff start week → `playoffStartWeek()`; which weeks hold a season's moves → `transactionWeeks()` (the site and the snapshot script both use it); who owned a draft slot → `draftSlotOwners()`; inactive owners → `INACTIVE_OWNERS`; ordinals, W–L records, dates, signed dollars, and win-% colors → `lib/utils`. Reuse them; don't re-derive.
- **Never hand-type what the data knows.** Season counts come from the snapshot manifest (footer, site description) or `state.years`; Career Milestones from `careerMilestones()`; the pick-order year from the stock-pick window; the season tab's year from `CURRENT_SEASON`. Hand-typed numbers go stale.
- **Every number ties out, or its gap is documented.** On every deploy, the control-totals test recomputes each owner-season's record, points for/against and potential points with the site's code and ties them to the totals Sleeper stores on the roster, and ties Sleeper's weekly player points to the NFL's box scores (nflverse) rescored with the league's settings. A difference that isn't in `KNOWN_GAPS` / `KNOWN_PLAYER_GAPS` (`lib/stats/control-totals.ts`), with its cause, fails the build. Find the cause before adding an entry; never loosen the tolerance to make a test pass.
- **The snapshot is an accelerator, never a dependency.** If `public/data/manifest.json` fails to load, `LeagueContext` must fall back to full live fetching. Don't break that path (BUILD.md M3 tests it). The footer and site description read the manifest at build time, so the file must exist to build — test the fallback by blocking the request, never by deleting the file. Never edit `public/data/` by hand — regenerate with `npm run snapshot`, and diff old seasons before committing.
- **Projections degrade gracefully.** `lib/current-season/projections.ts` and `season-stats.ts` hit undocumented Sleeper endpoints; every failure returns null and the season tab renders without projections or season stats (dashes; roster names fall back to the player index). Never let either break the page. Season FPTS are Sleeper's season totals × the league's `scoring_settings` — that matches the points Sleeper credits rostered players to the cent, so don't swap in Sleeper's preset `pts_half_ppr`.
- **Flair and ammo are true stats, never invented.** Every badge, ammo line, and Matchup of the Week reason comes from `lib/current-season/facts.ts`, the stat engine, or the stakes engine. Only championship-path games (`buildChampPathGameKeys`) count as playoff eliminations — a consolation or toilet-bowl game is never billed as one. 💦 Daddy is `daddyOf()` (75%+ over 5+ meetings) — the same rule as Records → Who's Your Daddy.
- **Stakes account for every other game.** Never claim a result "climbs to 3rd" or "clinches" from one game alone. Playoff odds are simulations and always labeled as odds (`lib/current-season/playoff-odds.ts`); clinch/elimination sentences are exact (`playoff-scenarios.ts`) — true in every outcome, with a tie in wins never counted for or against a team (points for can't be known ahead). If any remaining week's pairings are missing, show no stakes rather than simulate a partial schedule.
- **One luck formula.** Luck Index = actual wins (ties ½) − Σ weekly all-play expected wins ((teams outscored + ½ tied) / (teams that played − 1)), regular season only. It lives only in `lib/stats/luck.ts` — never recompute luck or all-play inline.
- **The power rating is the original Oberon Mt. formula.** `0.6 × avg + 0.2 × (high + low) + 0.2 × (win% × 200)` with the actual record's win%. The league tried all-play win% in its place and went back (2026-10-01) — keep the original unless the owner asks again. All-play stays a display column.
- **Live data overlays; it never mutates.** Only the season tab polls, via `useLiveSeason`, which layers fresh league/roster/matchup data over a copy of the global state (`withLiveSeason`) and flattens the season's games once per sync. Facts about past seasons (champ path, honors, career wins) memoize on `live.base`, which polls never change. The global store still loads once. A week is final only once `settings.last_scored_leg` reaches it — never infer "final" from points on the board (a Thursday game puts points up for the whole week).
- **The search overlay is portaled to `document.body`.** The navbar's `backdrop-filter` makes it the containing block for fixed descendants — rendering the overlay inside the nav clips it. Don't move it back. Every `fixed inset-0` modal portals the same way.
- **Pages are thin shells.** Computation belongs in `hooks/` or `lib/`. Pages should only call hooks, destructure results, and render JSX.

---

## UI & Design System (Midnight Prime)

"Trophy-room luxury": cinematic onyx surfaces, metallic-gold hairlines, condensed uppercase
display numerals, editorial restraint. **No glassmorphism, blur-on-cards, orb glows, or large
rounded corners.** Full spec + canonical patterns live in `DESIGN.md`.

- **Theme:** Dark mode only. Tokens in `tailwind.config.ts`: precise `gold` / `gold-soft` / `gold-dim` / `gold-bright`, `panel` / `panel-2`, `win` / `loss`, plus the legacy `s-` palette **remapped onto Midnight Prime** (e.g. `s-bg` = onyx `#050506`, `s-text` = warm off-white `#EDE9E0`, `s-green`/`s-red` = sage/brick) so un-migrated markup shifts with the theme.
- **Key colors:** page `#050506`, nav `#070708`, cards `#0B0B0D`; gold `#C9962E` (hairlines/active underline), `#E8CE8A` (emphasized values), text `#EDE9E0`→`#9AA0AC`→`#5C6270`; sage `#7FA886` win / brick `#B4636B` loss. Gold hairlines = `rgba(var(--gold-rgb),0.08–0.20)`; hover wash = `rgba(var(--gold2-rgb),0.04–0.05)` (RGB tuples in `globals.css`). Position colors (`lib/positions.ts`) and `OWNER_COLORS` (`lib/league/owners.ts`) are **functional palettes — never theme-swap or redefine them locally.**
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

- **Naming:** `kebab-case` files in `lib/` and `scripts/`, `PascalCase` component files, `useCamelCase` hook files; `camelCase` variables/functions, `PascalCase` components.
- **No regressions:** Never remove functionality or alter visual styling unless explicitly instructed.
- **No unnecessary abstractions:** Don't add hooks, utilities, or components that aren't called for by the task.
- **useMemo for heavy transforms:** Any computation over `allMatchups` (1000+ entries) or `ownerSeasons` should be wrapped in `useMemo`.
- **Verification gate after any structural change:** `npm run build` (TypeScript strict + static export), `npm test` (tie-outs included), `npm run lint` (0 errors), and `npm run knip` (zero findings) before committing. The deploy workflow runs the tests before it builds.
