# BUILD.md — Convicts FF League · Project State & Maintenance Plan

> **Single source of truth for continuing development.** Read this file, then `CLAUDE.md`
> (rules + directory map), then `DESIGN.md` (visual system) before writing any code.
> Last updated: **2026-10-08**.

---

## 1. Scope

One product: the **Convicts FF League** site — the league's archive since 2019 plus a
live hub for the season in progress. New features and visual changes happen when the
owner asks for them; otherwise the work is the maintenance calendar (§3), tied to the
league's yearly rhythm.

The **League App** (the site for any Sleeper league) and **Search 2.0** are on the
future waitlist (§4) by owner decision (2026-10-08): not goals, and nothing is built
around them. Revisit only if the owner brings one back.

---

## 2. Current State (verified 2026-10-08)

Static, client-side-only Next.js 16 app (App Router, `output: 'export'`), deployed to
GitHub Pages at `basePath: /convicts-ff-league`. TypeScript strict · Tailwind (Midnight
Prime) · Recharts · React Context · Vitest · knip.

- **Health:** 161 tests pass (14 files), the control-total tie-outs included, and the
  deploy runs them before it builds; `npm run build` succeeds (23 static pages); lint 0
  errors (12 known `react-hooks`/`no-img-element` warnings); knip reports zero unused
  files, exports, or dependencies. Snapshots frozen for **2019–2025**
  (season + transactions files) + `players.json` + manifest.
- **Live season:** `lib/league/config.ts` — `LEAGUE_ID = '1367670546694705152'` (the
  2026 league, "Misc Convicts", `in_season`, 10 teams, every user_id mapped) and
  `CURRENT_SEASON = 2026` (the season tab's label and `/2026` URL). Half-PPR,
  `playoff_teams: 6`, `playoff_week_start: 15`, trade deadline week 13.
- **Pages:** Home · **2026** (Power Rankings · Matchups with Matchup of the Week,
  playoff-odds stakes, emoji flair, and daily ammo · Rosters with season stats and
  schedules · Transactions · Draft board — live-synced with Sleeper) · Owners (+ per-owner
  profiles) · Seasons (Standings · Game Log · Finish Tracker · Scoring Trend) · Draft
  (Pick Order · Past Drafts · Slot Analysis · Steals & Busts · Draft Strategy) · Records ·
  Players. Cross-cutting: ⌘K "ask anything" search (16 local intents, no API keys),
  mobile drawer nav, PWA, reduced-motion support.

### Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server (`http://localhost:3000/convicts-ff-league`) |
| `npm run build` | Static export build — **run after every structural change** |
| `npm test` | Unit tests (`lib/**/__tests__/**/*.test.ts`) |
| `npm run lint` | ESLint 9 flat config |
| `npm run knip` | Unused files, exports, and dependencies — must report nothing |
| `npm run dataset` | Rebuild the tidy history tables in `data/` (`-- --cache <dir>` reuses downloads) |
| `npm run snapshot` | Freeze completed seasons into `public/data/` (post-season ritual) |
| `npm run snapshot -- --players-only` | Rebuild only `players.json` (after each draft) |
| `node scripts/luck-index.mjs <leagueId>` | Any league's Luck Index via `lib/stats/luck.ts` |

---

## 3. Maintenance Calendar

Every item ends with the standard **verification gate** (§6). Each fires on its date or
on an owner decision.

### M1 — Post-season ritual *(~Jan 2027, once Sleeper marks 2026 `complete`)*
1. `npm run snapshot`, then `npm run dataset`.
2. `git diff --stat public/data/` — expect **only** `season-2026.json` and
   `transactions-2026.json` added, `players.json` and `manifest.json` updated; any change
   to 2019–2025 files is a red flag: stop and diff before committing.
3. Record the season in `lib/league/history.ts` (`MANUAL_CHAMPS`, `MANUAL_SHAME`) and
   each owner's net in `lib/league/earnings.ts` — totals, the ledger order, and Records'
   Career Milestones compute themselves. The footer's season count follows the manifest.
4. The Trash Talk cards (`lib/league/trash-talk.ts`) are hand-written prose that quote
   career numbers through 2025 ("7 seasons", "−$410 all-time") — ask the owner whether
   to refresh them.
5. Verification gate. 2026 must tie out: any new difference needs its cause found and
   written into `KNOWN_GAPS` before the tests pass. Then a visual check that 2026 renders
   from the snapshot with network blocked to `api.sleeper.app`.
6. Commit `public/data/`, `data/`, and the history/earnings lines.

### M2 — Pre-draft and draft *(Jul–Aug 2027)*
1. **Stock-pick window closes Jul 15:** set `STOCK_PICKS` and `MARKET_BENCHMARK` in
   `lib/league/stock-picks.ts`, prices frozen at the Jul 15 close (never live). The pick
   order tab's year and window dates follow the data.
2. `BUY_INS[2027]` and the draft date (`NEXT_DRAFT_AT` / `NEXT_DRAFT_LABEL` in
   `lib/league/history.ts`) once the league sets them — the Draft Hub countdown returns.
3. **After the draft:** in `lib/league/config.ts`, set `LEAGUE_ID` to the new league and
   `CURRENT_SEASON = 2027` (the tab moves to `/2027`; no folder rename). Run
   `npm run snapshot -- --players-only` so rookies have names. Check `/2027` at 375px.

### M3 — Degraded-mode check *(after any change to data loading; last passed 2026-10-09)*
Block a request in the browser (Chrome DevTools → Network → Block request URL/domain)
and reload. Block it; never delete the file — the footer and site description read
`public/data/manifest.json` at build time, so the build needs it. Fix only crashes or
blank states.
1. **Projections down** (`api.sleeper.com`) — **passed 2026-09-26**: the season tab's
   matchups render without the projection row; roster names come from the player index.
2. **Snapshot down** (`/convicts-ff-league/data/manifest.json`) — **passed 2026-10-09**
   on the production build: every page loads straight from Sleeper (~180 requests;
   Players → Transactions reads every season live in ~12 s), and every archive page's
   text matches the snapshot-backed site, 2021's 18th week of moves included.

### M4 — Deferred owner-decision findings *(no deadline)*
Report-only; each is a deliberate design choice, so fixing it changes locked
architecture or the Midnight Prime palette. **No action without owner sign-off.**
1. **Color contrast (a11y 96, not 100):** tiny uppercase labels in `#5C6270`, `#8A7439`,
   `#8A4A46` sit below WCAG AA against onyx. Brightening is a theme change — owner call.
2. **LCP 5.6s (perf 73):** hero renders after the client-side data load — inherent to
   client-only architecture. Options: prerender hero text from snapshot at build time,
   or accept it.
3. **Focus traps:** modals close on Escape and announce as dialogs, but Tab can reach the
   page behind. Full trap is a larger change; add only if the owner wants it.

### D — The deeper version *(owner-approved 2026-10-20)*
The goal: answer who in this league is actually good, and how much of each result was
skill versus luck, with every number proven against a source neither of us controls.
1. **Phase 0, foundation (no visible change).**
   - **Done 2026-10-20:**
     - `data/`, the tidy history tables (`npm run dataset`, dictionary in `data/README.md`).
     - The exact best-lineup function (`lib/stats/lineups.ts`).
     - The tie-outs, run on every deploy: all 70 records tie; points and potential points
       tie for 2022-2025 except one documented 2024 gap.
     - Rescored NFL box scores: 14,684 of 14,691 rostered player-weeks tie to the cent.
     - Each of the 44 remaining differences is documented with its cause, including two
       Sleeper kicker errors in 2019.
     - Sleeper's weekly projections for 2019-2025 (`data/projections.csv`), with kickoff
       times. None is provably pre-kickoff: 2019-2022 rows carry no update time, and
       2023-2025 rows mostly changed after kickoff. Grades built on them must say
       "Sleeper's final projection".
   - **Open:**
     - A draft-day ADP for every pick.
     - Rescoring team defenses, the likely cause of 2019's gaps.
     - A scheduled GitHub Action that commits a weekly snapshot before kickoff. It's the
       only way to get true pre-kickoff projections. Waiting on the owner's OK, since it
       runs unattended and commits to main.
2. **Phase 1, decision grading:** points above replacement by draft, waivers, trades and
   lineup calls. Lineup calls are graded against projections at kickoff, then converted
   to wins and shown as a wins bridge on each owner's profile.
3. **Phase 2, track record:** replay 2019-2025 week by week. Score the playoff odds and
   Oberon with Brier score, log loss and calibration against naive baselines, and check
   the simulator against ffsimulator.
4. **Phase 3, uncertainty:** sample sizes, ranges, shrinkage and repeatability for
   existing stats, plus a list of which are mostly noise. Nothing gets removed without
   the owner's approval.

### Done
- **2026-08-14 —** 2026 buy-in (`2026: 150`).
- **2026-09-26 audit (owner-approved):** `/transactions` and `/gamelog` folded into
  Players and Seasons; transactions split into lazy `transactions-<year>.json` (first-visit
  history payload 3.2 MB → 1.3 MB); `players.json` name index replaces Sleeper's ~15 MB
  dump; one Luck Index formula; shared `SortHeader`.
- **2026-10-08 backend cleanup (owner-approved):**
  - Folders by page and by role: `lib/league` (hand-maintained data), `lib/sources`
    (where data comes from), `lib/current-season` (was `lib/preview`), `lib/positions`;
    components moved next to the pages that use them. `/this-week` redirect removed;
    local-only files untracked; knip added.
  - One version of each rule: ordinals, W–L records, dates, win-% colors, inactive
    owners, playoff start week, transaction weeks, draft-slot owners, the transaction
    loader, and the Daddy rule. Dead store field, unused exports, and stale barrel
    entries removed.
  - The 2026 tab flattens its games once per sync; past-season facts skip the polls.
  - Consistency fixes: Records' Daddy card uses the 2026 tab's rule (75%+ over 5+);
    Players → Transactions includes the season in progress; 2021's 12 week-18 pickups
    restored (2021 ran 18 weeks; the snapshot had stored 17); season counts, Career
    Milestones, and the pick-order year are derived; earnings stored per season with
    computed totals; the season tab's route comes from `CURRENT_SEASON`.
  - Owners page math moved into `lib/stats` (`careerLeaderboard`, `ownerProfile`) with
    tests; the leaderboard's header cell is module-level. Every leaderboard sort (both
    views) and all 12 profiles verified identical at desktop and 375px.
- **2026-10-09 —** Career Leaderboard uses the shared `SortHeader` (owner-approved):
  direction arrows like every other table, and sorting by Manager works (A–Z, then Z–A).
  Every numeric sort keeps its order.

### Open risks

| # | Area | Risk | Detection | Mitigation |
|---|---|---|---|---|
| B4 | `lib/current-season/projections.ts`, `season-stats.ts` | Undocumented `api.sleeper.com` projections, season-stats, and per-player endpoints can change/vanish any time | Projections or the Rosters season columns go blank (dashes); roster names come from the player index (designed behavior) | M3 |
| B8 | `lib/current-season/live.ts` | Week finality comes from `settings.last_scored_leg`; if Sleeper stops updating it, a finished week stays "in progress" | Power rankings stop advancing past a completed week | Fallback is `leg − 1`; check the league JSON |
| B9 | `lib/current-season/stakes.ts` | Playoff odds need every remaining week's pairings, fetched once per visit from `/league/<id>/matchups/<week>` | Matchup stakes disappear (odds hide rather than simulate a partial schedule) | Designed behavior — check a future week's matchups JSON |
| B6 | Snapshot drift | Regenerating old snapshot years could shift historical name resolution | Career totals change unexpectedly | Snapshots freeze history — never regenerate old years without diffing (M1) |
| B7 | Sleeper display-name churn | Owner renames mid-season fall back to user_id mapping (fine), but aliases power search | New alias not searchable | Add the alias to `DISPLAY_NAME_TO_OWNER` in `lib/league/owners.ts` |

**Reproduction protocol for any data bug:** `npm run dev`, open the affected page,
compare against Sleeper's own UI for the same league/week. Historical numbers must match
the committed snapshots — if a change alters pre-2026 career totals, the change is wrong.

---

## 4. Future Waitlist *(not goals — nothing is built around these)*

### W1 — League App: the site for any Sleeper league
Parked 2026-10-08. The idea (2026-07): the same pages driven by any Sleeper league ID
through a dynamic `/league/[id]` route on Vercel. If it ever comes back, the decisions
already made still hold:
- **Same repo, config-driven, not a fork.** Convicts would be the flagship config, and
  its build the regression oracle. Today's `lib/league/` folder is the natural seed of
  that config: everything league-specific already lives there, and everything else
  flows through `resolveOwnerName()` and `lib/stats/`.
- **Sleeper-only, no backend** (ESPN and Yahoo need cookies or OAuth, so a server).
  Client-side fetching with IndexedDB caching for completed seasons; progressive
  loading, current season first.
- **Canonical owner names stay the key.** Owners derived from user_ids when a league has
  no config; commissioner corrections override bracket-derived champions per year.
- **No earnings, buy-ins, or stock picks** for other leagues (no API has them); trash
  talk would be generated from each league's history.

### W2 — Search 2.0: open questions over the league database
Deferred 2026-10-01. Goal: answer open-ended stat questions — e.g. *"what's Daniyaal's
top scoring wide receiver?"* — instead of today's 16 fixed intents. Stays **local-only**
(§5.6): truly "any question" would need an AI model, which means an API key plus a
server (GitHub Pages can't hide a key), already ruled out.
1. **Slot grammar** (`lib/search/`): parse a question into composable slots — subject
   (owner, player, position, NFL team), scope (season, week, regular season vs playoffs,
   vs an opponent), metric (points as a starter, starts, record, trades, adds, FAAB,
   draft picks, finishes), and shape (top / most / least / average / count / top N).
2. **Fact tables**, built once and memoized: per-player × owner × week starter points
   from the season snapshots' `players_points` + `starters`, transactions from the lazy
   `transactions-<year>.json`, picks from `draftData`.
3. **Resolver:** slots → filter, group, aggregate → an answer card (top result plus the
   next few) with chips showing how the question was read.
4. **Fallbacks:** unparseable phrasing gets the closest reading plus example chips —
   never a guess presented as an answer.
5. **Tests** per slot and per launch question; the 16 current intents keep working.

Launch questions: "Daniyaal's top scoring WR", "most points by a QB in 2024", "who has
made the most trades", "Kerry's best draft pick", "Teja's record vs Eric in the
playoffs", "most FAAB spent in 2025".

---

## 5. Locked Decisions & Guardrails (do not relitigate)

1. **Client-side only** — static export to GitHub Pages, no backend, no SSR, no API routes.
2. **Snapshot-first, live-fallback.** The snapshot is an accelerator, never a dependency —
   if `manifest.json` fails, full live fetching must still work.
3. **One global store** — `LeagueContext` loads once on mount, never refetches. The
   season tab's `useLiveSeason` polls and *overlays* a copy; it never writes back.
4. **Stat math lives only in `lib/stats/`** — half-titles (0.5), shared-winner matching,
   tie-as-win rules, the Daddy rule, career milestones, the career leaderboard, and owner
   profiles are centralized. Never recompute in components.
5. **Name resolution via `resolveOwnerName()` / `rosterUserMaps[year]`** — canonical
   names; identity data lives in `lib/league/owners.ts`.
6. **Search is local-only by explicit owner decision** — no LLM, no API keys. Extend via
   intents in `lib/search/parse.ts` + `resolvers.ts` (ordered rules, first hit wins;
   resolvers call existing `lib/stats` math).
7. **Barrel imports only:** `@/lib/league`, `@/lib/sources`, `@/lib/data-processing`,
   `@/lib/stats`, `@/lib/current-season`, `@/lib/search` (plus `@/lib/positions`,
   `@/lib/utils`). Barrels list only what the app imports — knip enforces it.
8. **Manual corrections** (`MANUAL_CHAMPS`, `MANUAL_SHAME`, `MANUAL_PLAYOFF_OVERRIDES`,
   `EXCLUDED_GAME_SCORES`) fix bad Sleeper data. Keep them.
9. **Projections degrade gracefully** — every failure path in
   `lib/current-season/projections.ts` and `season-stats.ts` returns `null`; the season
   tab renders without them.
10. **Search overlay and every `fixed inset-0` modal portal to `document.body`.**
11. **Pages are thin shells** — computation in `hooks/` or `lib/`.
12. **League-size and calendar numbers come from Sleeper `settings`** (via
    `lib/data-processing/season-settings.ts`), never literals; values the data knows are
    derived, never hand-typed.
13. **Never edit `public/data/` by hand** — `npm run snapshot` generates it. A one-off
    repair must reproduce exactly what the script would write and leave every existing
    byte unchanged (as with 2021's week 18 on 2026-10-08).
14. No CSS modules/styled-components; no abstractions not demanded by a task; never
    change the Midnight Prime theme or remove features unless explicitly asked.

---

## 6. LLM-Friendly Execution Rules

For **any** model picking up a task:

### Before touching code
1. Read `CLAUDE.md` in full. It overrides your defaults.
2. Read §5 (locked decisions) above.
3. Read every file you will edit, in full, before editing.
4. Never edit files under `public/data/` by hand — they are generated.

### While coding
- **Imports:** only from barrels (§5.7).
- **Styling:** Tailwind utilities only; copy classes from an existing sibling component.
  Never invent new colors — use tokens from `tailwind.config.ts`
  (`gold`, `panel`, `win`, `loss`, `s-*`).
- **New computation** over `allMatchups` or `ownerSeasons` → `useMemo`, function in
  `lib/`, called from a hook, rendered in the page. Pages stay thin.
- **Shared helpers first:** formatting (`lib/utils`), season settings
  (`season-settings.ts`), and stat rules (`lib/stats`) already exist — reuse them.
- **New search intents:** ordered regex rule in `lib/search/parse.ts`, resolver in
  `resolvers.ts` calling existing `lib/stats` math, extend the `Intent` union
  (exhaustive record — TypeScript enforces it), add parse + resolver tests.
- **Names:** `kebab-case` lib files, `PascalCase` components, `camelCase` functions.
- One task = one commit. Do not bundle tasks.

### After coding (mandatory verification gate, every task)
```
npm run build      # must succeed (static export, TypeScript strict)
npm test           # all tests must pass (148 baseline)
npm run lint       # 0 errors
npm run knip       # zero findings
npm run dev        # check the affected page(s), at 375px too
```
For refactors, the site must render **identically** before and after — compare the
affected pages' text. If the build fails on a page you didn't touch, you broke a shared
module — revert and re-approach; do not patch the symptom.

### Execution order
- **On their dates:** M1–M2 (§3); M3 after any change to data loading; M4 items only on owner sign-off.
- Anything not listed here that changes features or visuals: **ask the owner first.**
