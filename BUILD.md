# BUILD.md — Convicts FF League · Project State & Execution Plan

> **Single source of truth for continuing development.** Read this file, then `CLAUDE.md`
> (rules + directory map), then `DESIGN.md` (visual system) before writing any code.
> Last updated: **2026-07-11**.

---

## 1. Vision — Two Products, One Codebase

This repo now serves two products built on the same config-driven core:

- **Product A — Convicts FF League** (this deployment). The 7-season archive as it exists
  today. **Feature-frozen and owner-approved** — no new features, no visual changes.
  Remaining work is a maintenance calendar (§3) tied to the league's yearly rhythm.
- **Product B — League App** *(working name — rename later)*. The same pages and
  components, driven by **any Sleeper league ID** via a dynamic `/league/[id]` route,
  deployed to **Vercel** for production testing. Everything league-specific becomes
  optional config; everything else is derived from the Sleeper API.

**Strategy decision (2026-07-11, owner-approved):** same repo, config-driven — *not* a
fork. Convicts becomes the flagship `LeagueConfig` instance; Product B is a second
deployment target. One codebase means Convicts inherits every core improvement, and the
Convicts build acts as the regression oracle for all refactors.

**Scope decisions locked for Product B v1:**
- **Sleeper-only.** ESPN requires private-league cookies and Yahoo requires OAuth — both
  force a backend and credential storage. Out unless demand ever justifies it (Phase 3+).
- **No backend.** Client-side fetching with IndexedDB caching, same as Convicts' model.
  Vercel is used only for hosting/clean dynamic URLs, not server code.
- **No earnings / buy-ins / stock-picks** in the generalized app — not derivable from any
  API. These remain Convicts-only features, hidden when the config lacks them.
- **Trash talk is generated** from each league's history (deterministic archetype
  templates, modeled on `lib/preview/smack-talk.ts`). Convicts keeps its hand-written
  cards via a config override.

---

## 2. Product A: Convicts — Current State (verified 2026-07-11)

Static, client-side-only Next.js 16 app (App Router, `output: 'export'`), deployed to
GitHub Pages at `basePath: /convicts-ff-league`. TypeScript strict · Tailwind (Midnight
Prime) · Recharts · React Context · Vitest.

- **Health:** 73 unit tests pass (5 files); `npm run build` succeeds; lint 0 errors
  (~45 known `react-hooks` warnings). Snapshots frozen for **2019–2025** + manifest.
- **Live season:** `lib/config.ts` `LEAGUE_ID = '1367670546694705152'` → the **2026
  league** ("Misc Convicts", `pre_draft`, 10 teams, all user_ids mapped). Draft
  2026-08-15; `playoff_teams: 6`, `playoff_week_start: 15`.
- **Pages:** Home, Seasons/game log, Records, Owners (+ per-owner profiles), Players,
  Season trends, This Week, Draft (countdown banner), Transactions. Cross-cutting:
  ⌘K "ask anything" search (16 local intents, no API keys), mobile drawer nav, PWA,
  reduced-motion support. July 2026 offseason plan complete — see git history for detail.

### Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Static export build — **run after every structural change** |
| `npm test` / `npx vitest run` | Unit tests (`lib/**/__tests__/**/*.test.ts`) |
| `npm run lint` | ESLint 9 flat config |
| `npm run snapshot` | Freeze completed seasons into `public/data/` (yearly ritual) |

---

## 3. Product A: Maintenance Calendar

Every item ends with the standard **verification gate** (§7). Nothing here is actionable
today — each fires on its date or on an owner decision.

### M1 — 2026 buy-in *(when the league sets it — formerly T2b)*
`BUY_INS` (currently `lib/league-history.ts`; moves into the Convicts config in Phase 1)
ends at `2025: 125`. Add the `2026: <amount>` entry so earnings math stays correct at
season's end.

### M2 — In-browser degraded-mode checks *(season start, ~Sept 2026 — formerly T4b)*
The browser half of the degraded-mode audit (code half passed 2026-07-11):
1. `npm run dev`, open `/this-week` during a live week; confirm previews render.
2. In DevTools, block requests to the projections URL (see
   `lib/preview/projections.ts`), reload — cards must render without the projection row,
   no thrown errors.
3. Block `public/data/manifest.json`, reload `/` — the site must still fully load via
   live Sleeper fetches (slower is fine, broken is not).
4. Report findings; fix only crashes/blank states.

### M3 — Post-season snapshot ritual *(~Jan 2027 — formerly T9)*
1. `npm run snapshot`.
2. `git diff --stat public/data/` — expect **only** `season-2026.json` added and
   `manifest.json` updated; any change to 2019–2025 files is a red flag: stop and diff
   before committing.
3. Verification gate + visual check that 2026 renders from snapshot with network blocked
   to `api.sleeper.app`.
4. Commit `public/data/`.
5. Set the next draft date (`nextDraftDate` in the Convicts config after Phase 1) once
   the 2027 date is known so the Draft Hub countdown returns.

### M4 — Deferred owner-decision findings *(no deadline — formerly T12)*
Report-only; both are deliberate design choices, so fixing them changes locked
architecture or the Midnight Prime palette. **No action without owner sign-off.**
1. **Color contrast (a11y 96, not 100):** tiny uppercase labels in `#5C6270`, `#8A7439`,
   `#8A4A46` sit below WCAG AA against onyx. Brightening is a theme change — owner call.
2. **LCP 5.6s (perf 73):** hero renders after the client-side data load — inherent to
   client-only architecture. Options: prerender hero text from snapshot at build time,
   or accept it.
3. **Focus traps:** modals close on Escape and announce as dialogs, but Tab can reach the
   page behind. Full trap is a larger change; add only if the owner wants it.

### Open risks

| # | Area | Risk | Detection | Mitigation |
|---|---|---|---|---|
| B4 | `lib/preview/projections.ts` | Undocumented Sleeper endpoint can change/vanish any time | Projection row silently disappears (designed behavior — verify it stays silent) | M2 |
| B6 | Snapshot drift | Regenerating old snapshot years could shift historical name resolution | Career totals change unexpectedly | Snapshots freeze history — never regenerate old years without diffing (M3) |
| B7 | Sleeper display-name churn | Owner renames mid-season fall back to user_id mapping (fine), but aliases power search | New alias not searchable | Add the alias to the Convicts config when noticed |

**Reproduction protocol for any data bug:** `npm run dev`, open the affected page,
compare against Sleeper's own UI for the same league/week. Historical numbers must match
the committed snapshots — if a change alters pre-2026 career totals, the change is wrong.

---

## 4. Product B: League App — Architecture

**Code audit (2026-07-11):** league-specific data is ~250 lines across
`lib/owner-map.ts`, `lib/league-history.ts`, `lib/narratives.ts`, plus `LEAGUE_ID` in
`lib/config.ts`. Only 8 lib files + 2 pages import it; zero owner names are hardcoded in
components. Everything else already flows through `resolveOwnerName()` and `lib/stats/`.

### The config layer

Two shapes: **`LeagueConfig`** is what a league author writes (only `leagueId` required);
**`ResolvedLeague`** is what the app consumes (every field materialized, derived from
Sleeper data wherever the config is silent).

```ts
interface OwnerIdentity {              // one human across seasons
  name: string                         // canonical display name ('Teja')
  userIds: string[]                    // every Sleeper user_id this human has used
  aliases?: string[]                   // historical display_names
  fullName?: string                    // avatar initials; defaults to name
  color?: string                       // hex; auto-assigned from palette if absent
}

interface LeagueCorrections {          // commissioner fixes for bad Sleeper data
  champions?: Champion[]               // OVERRIDES derived results, per-year
  shame?: ShameLoser[]
  playoffOverrides?: { year: number; owner: string; finish?: number }[]
  excludedGames?: { owner: string; year: number; week: number }[]
}

interface LeagueConfig {
  leagueId: string                     // newest season; chain walks back via previous_league_id
  name?: string                        // defaults to Sleeper league.name
  owners?: OwnerIdentity[]             // absent → derived: one owner per user_id
  corrections?: LeagueCorrections
  narratives?: TrashTalkCard[]         // hand-written; absent → generated from history
  nextDraftDate?: string               // absent → countdown hidden
  // Convicts-only feature modules (earnings, buy-ins, stock picks) slot in later
}

interface ResolvedLeague {             // all lookups the codebase already uses
  leagueId: string; name: string
  userIdToOwner: Record<string, string>
  displayNameToOwner: Record<string, string>
  ownerFullNames: Record<string, string>
  ownerColors: Record<string, string>  // config → else deterministic palette by user_id
  champions: Champion[]                // derived ⊕ corrections (corrections win per-year)
  shame: ShameLoser[]
  playoffOverrides: LeagueCorrections['playoffOverrides']
  excludedGames: LeagueCorrections['excludedGames']
  narratives: TrashTalkCard[] | null   // null → generate at render time
  nextDraftDate: string | null
}
```

**Access pattern — active-league singleton.** `getLeague()` / `setActiveLeague()` in
`lib/league-config/active.ts`, statically initialized with the Convicts config. The app is
client-side with one league per page load, so consumers swap direct constant imports for
`getLeague().x` with no signature changes. Phase 2's dynamic route builds a
`ResolvedLeague` from live Sleeper data and calls the same setter before computation.

**Design invariants for the config layer:**
- **Canonical owner *name* stays the key** throughout `lib/stats` / `lib/search` /
  components. Rekeying onto owner IDs would ripple everywhere — explicitly out of scope.
- **Corrections are overrides, not the source of truth.** `resolved.champions` =
  `deriveChampions()` (bracket data) merged with `corrections.champions` per-year.
  Phase 1 stubs derivation to empty (Convicts' corrections cover all 7 years → output
  identical); Phase 2 implements real bracket inference.
- **Colors degrade gracefully:** sort owners by first `user_id` (stable), deal from a
  12-color palette; config overrides win, so Convicts keeps its exact colors.
- **Generated trash talk** (`lib/narratives/generate-trash-talk.ts`): classify each
  active owner into an archetype by priority rules (most titles, most toilet bowls, best
  record with zero titles, win% nearest .500, highest variance, longest drought, departed
  owners grouped), fill 2–3 body templates per archetype from real stats. Deterministic —
  seeded by owner name. Earnings references only when that module is present.

### Performance model (Product B)

A first-time visitor to an arbitrary league has no snapshot — the full live chain walk is
slow. Mitigations, in order: **IndexedDB caching** (completed seasons are immutable —
cache after first fetch, instant thereafter) and **progressive rendering** (current season
first, backfill history in the background). Server-side snapshot caching is a Phase 3+
decision, never a v1 dependency.

---

## 5. Roadmap

### Phase 1 — De-hardcode (config layer) · **actionable now**

Pure refactor with a built-in oracle: every resolved value for Convicts equals today's
constants, so the rendered site must be **pixel-identical to main** after every step.

**New files:**

| File | Contents |
|---|---|
| `lib/league-config/types.ts` | `LeagueConfig`, `ResolvedLeague`, `OwnerIdentity`, `LeagueCorrections` (§4) |
| `lib/league-config/resolve.ts` | `resolveLeague(config)` — map projections, palette assignment, corrections merge, `deriveChampions()` stub |
| `lib/league-config/active.ts` | `setActiveLeague()` / `getLeague()` singleton, statically initialized with Convicts |
| `lib/league-config/convicts.ts` | Convicts `LeagueConfig` — content of `owner-map.ts` (owner maps), `league-history.ts`, `narratives.ts` restructured |
| `lib/league-config/index.ts` | Barrel (imports go through `@/lib/league-config`) |
| `lib/narratives/generate-trash-talk.ts` | Archetype generator (dead code for Convicts, built + testable now) |

**Modified files** (each a mechanical constant → `getLeague()` swap):
`lib/data-processing/resolve-owner.ts` (the linchpin, 2 lines) ·
`lib/stats/career.ts` (`EARNINGS_DATA` import stays) · `lib/stats/game-filters.ts` ·
`lib/data-processing/build-seasons.ts` · `lib/utils.ts` (`ownerColor`, `getChampion`,
`getShameLoser`, full names) · `lib/search/entities.ts` · `context/LeagueContext.tsx`
(`LEAGUE_ID`) · `app/records/page.tsx` (`TRASH_TALK` → `narratives ?? generateTrashTalk`)
· `app/draft/page.tsx` (`NEXT_DRAFT_DATE`) · `lib/constants.ts` (league exports removed;
keeps `SLEEPER_API`, `BASE_PATH`, `POS_*`, `EARNINGS_DATA`, `BUY_INS`) ·
`lib/stats/__tests__/*` (fixtures via `setActiveLeague()` with a test config).

**Deleted after migration:** `lib/league-history.ts`, `lib/narratives.ts`;
`lib/owner-map.ts` shrinks to the `POS_*` palettes (functional, not league-specific).
**Untouched:** all components, other pages, `lib/preview/`, snapshots, deploy pipeline.
`BASE_PATH` stays in `lib/config.ts` — deployment concern, not league concern.

**Sequencing (verification gate after each step):**
1. Config layer + Convicts config + singleton — pure addition, no consumers.
2. Owner-identity swap (resolve-owner, utils colors/names, search entities).
3. History swap (career, build-seasons, game-filters, utils champion/shame) + tests.
4. Trash-talk generator + records page + draft page.
5. Delete old files, clean the barrel; full regression pass vs main.

### Phase 2 — Dynamic league route + Vercel

- `/league/[id]` entry: fetch league + users, build a derived `ResolvedLeague`
  (owners from user_ids, latest display_names, auto colors), `setActiveLeague()`, render.
- Landing page with a league-ID input (paste ID or Sleeper username → league picker).
- `deriveChampions()` / shame from bracket data (replaces the Phase 1 stub) using the
  existing `lib/data-processing/bracket-finish.ts` logic.
- **Feature gating:** earnings ledger, buy-ins, stock picks, hand-written narratives —
  render only when the config provides them.
- **Settings-driven standings:** divisions, playoff team counts, median formats read from
  Sleeper `settings` (league-size rule §6.2 already bans literals).
- IndexedDB season cache + progressive load.
- Vercel project for Product B coexisting with the GitHub Pages static export (Convicts
  keeps `output: 'export'` + `basePath`; the Vercel build uses env-driven config).

### Phase 3 — Productization *(deferred; decide only on real demand)*

Naming/branding · commissioner corrections UI (web-editable `LeagueCorrections`) ·
server-side snapshot cache if first-load times hurt · ESPN/Yahoo (**explicitly out**
unless demand justifies a backend + OAuth/credential handling).

---

## 6. Locked Decisions & Guardrails (do not relitigate)

1. **Product A is client-side only** — static export to GitHub Pages, no backend, no SSR,
   no API routes. **Product B** may deploy to Vercel for dynamic URLs but remains
   backend-free in v1.
2. **Snapshot-first, live-fallback.** The snapshot is an accelerator, never a dependency —
   if `manifest.json` fails, full live fetching must still work.
3. **One global store** — `LeagueContext` loads once on mount, never refetches.
4. **Stat math lives only in `lib/stats/`** — half-titles (0.5), shared-winner matching,
   tie-as-win rules are centralized. Never recompute in components.
5. **Name resolution via `resolveOwnerName()` / `rosterUserMaps[year]`** — canonical
   names; identity data lives in the league config (Phase 1+).
6. **Corrections (formerly manual overrides) correct bad Sleeper data. Keep them** —
   as config overrides, never deleted.
7. **Barrel imports only:** `@/lib/constants`, `@/lib/stats`, `@/lib/search`,
   `@/lib/preview`, `@/lib/data-processing`, **`@/lib/league-config`** (Phase 1+).
8. **Search is local-only by explicit owner decision** — no LLM, no API keys. Extend via
   intents in `lib/search/parse.ts` + `resolvers.ts` (ordered rules, first hit wins;
   resolvers call existing `lib/stats` math).
9. **Projections degrade gracefully** — every failure path in
   `lib/preview/projections.ts` returns `null`; This Week renders without the row.
10. **Search overlay stays portaled to `document.body`** (navbar `backdrop-filter` clips
    fixed descendants).
11. **Pages are thin shells** — computation in `hooks/` or `lib/`.
12. League-size numbers come from Sleeper league `settings`, never literals.
13. Never edit `public/data/` by hand — generated by `npm run snapshot`.
14. No CSS modules/styled-components; no abstractions not demanded by a task; never
    change the Midnight Prime theme or remove features unless explicitly asked.

---

## 7. LLM-Friendly Execution Rules

For **any** model picking up a task:

### Before touching code
1. Read `CLAUDE.md` in full. It overrides your defaults.
2. Read §6 (locked decisions) above.
3. Read every file you will edit, in full, before editing.
4. Never edit files under `public/data/` by hand — they are generated.

### While coding
- **Imports:** only from barrels (§6.7).
- **Styling:** Tailwind utilities only; copy classes from an existing sibling component.
  Never invent new colors — use tokens from `tailwind.config.ts`
  (`gold`, `panel`, `win`, `loss`, `s-*`).
- **New computation** over `allMatchups` or `ownerSeasons` → `useMemo`, function in
  `lib/`, called from a hook, rendered in the page. Pages stay thin.
- **New search intents:** ordered regex rule in `lib/search/parse.ts`, resolver in
  `resolvers.ts` calling existing `lib/stats` math, extend the `Intent` union
  (exhaustive record — TypeScript enforces it), add parse + resolver tests.
- **Names:** files `kebab-case`, components `PascalCase`, functions `camelCase`.
- One task = one commit. Do not bundle tasks.

### After coding (mandatory verification gate, every task)
```
npm run build      # must succeed (static export, TypeScript strict)
npx vitest run     # all tests must pass (73 baseline)
npm run dev        # visually check the affected page(s)
```
Phase 1 steps add the oracle check: the Convicts site must render **identically to main**.
If the build fails on a page you didn't touch, you broke a shared module — revert and
re-approach; do not patch the symptom.

### Execution order
- **Now:** Phase 1 steps 1–5, in order (§5).
- **After Phase 1:** Phase 2 (§5).
- **On their dates:** maintenance calendar M1–M3 (§3); M4 items only on owner sign-off.
- Anything not listed here that changes features or visuals: **ask the owner first.**
