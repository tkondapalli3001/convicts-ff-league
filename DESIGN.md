# DESIGN.md — Convicts FF League

The design system and architecture reference for the site. CLAUDE.md covers
working rules for AI-assisted development; this file covers *what the system
is* — visual language, component inventory, and how data moves.

---

## Identity

**Midnight Prime — "trophy-room luxury."** A professional sports-analytics
archive for a private league: dark mode only, cinematic near-black backgrounds,
metallic-gold hairlines, condensed uppercase display numerals, high-density
tables, and editorial restraint. It should feel like a premium analytics product
that happens to be about 12 friends, not a hobby page.

Depth comes from 1px gold-tinted borders and subtle background steps — **not**
from glassmorphism, blur-on-cards, orb glows, drop shadows, or large rounded
corners. Never change the visual theme or remove features without being asked.

## Color palette

Tokens live in `tailwind.config.ts`. Two families:

**Midnight Prime (precise) tokens** — use these for all new work:

| Token | Value | Role |
|---|---|---|
| `gold` | `#C9962E` | Hairline rules, borders, active tab underline, monogram |
| `gold-soft` | `#C9A24B` | Section headings, secondary gold text, icons |
| `gold-dim` | `#8A7439` | Muted gold (years, kbd hints, tags) |
| `gold-bright` | `#E8CE8A` | Emphasized values (good win%, record values, HOF names) |
| `panel` / `panel-2` | `rgba(10,10,12,0.7/0.5)` | Hero side panels, search strip, tab bars |
| `win` | `#7FA886` | Win / positive (muted sage green) |
| `loss` | `#B4636B` | Loss / negative / shame (muted brick red) |

**Legacy `s-` palette** — remapped onto Midnight Prime so un-migrated markup
shifts with the theme (don't reintroduce the old Statmuse values):

| Token | Value | Role |
|---|---|---|
| `s-bg` | `#050506` | Page background (Pure Onyx) |
| `s-bg2` / `s-bg3` / `s-bg4` | `#070708` / `#0B0B0D` / `#121216` | Nav / card / raised panel |
| `s-text` / `s-text2` / `s-text3` / `s-muted` | `#EDE9E0` / `#9AA0AC` / `#5C6270` / `#3A4150` | Text hierarchy: bright → faint |
| `s-gold` | `#C9962E` | Alias of `gold` |
| `s-green` / `s-red` | `#7FA886` / `#B4636B` | Alias of `win` / `loss` |

**Variable-alpha gold** comes from CSS RGB tuples in `globals.css`:
`--gold-rgb: 230,190,90` (light gold — hairline borders `0.08–0.20`) and
`--gold2-rgb: 201,150,46` (deep gold — hover washes `0.04–0.05`, emphasis).
Use e.g. `rgba(var(--gold-rgb),0.10)` for a default hairline.

**Metallic gradients** (background-clip:text):
- Hero / big display: `linear-gradient(180deg,#F8E3A0 0%,#E8B84B 45%,#A87A22 100%)` → `.text-hero-gold`
- Wordmark / small lockups: `linear-gradient(180deg,#F5D67B,#C9962E)` → `.text-metal`

**Functional palettes — never theme-swap.** Owner identity colors live in
`OWNER_COLORS`; NFL position colors in `POS_COLORS` / `POS_TEXT_CLASSES` /
`POS_BADGE_CLASSES` — all in `lib/owner-map.ts`, exported via `@/lib/constants`.
These encode meaning (which owner, which position), not theme. Never redefine
locally or fold into the gold palette.

## Shape & typography

- **Radius:** cards `6px` (`.gl` / `.bento-card` — onyx `#0B0B0D` + 1px gold
  hairline, no blur), inner chips/badges square or `2px`, pills `rounded-full`,
  avatars `50%`. No large rounded corners.
- **Borders:** 1px gold-tinted hairlines everywhere; section headers use a 20px
  gold hairline **dash** + uppercase tracked heading in `gold-soft`.
- **Typography:** `Barlow Condensed` (700/800) for display — *all* big numbers,
  names, page titles, and table numerals; uppercase, tight leading (0.92–1),
  1–2px tracking on titles. `Archivo` (400–800) for UI/body; labels are 9–11px,
  weight 600–700, uppercase, 1.5–6px tracking. Loaded via `next/font` in
  `layout.tsx` (`--font-barlow` / `--font-archivo`); `font-display` = Barlow.
  **Inter is fully removed.**
- **Scale (desktop):** hero name 100px; page title 64px; section stat values
  44px; card stat values 28–34px; table numerals 17–19px; body 12–13px;
  micro-labels 9–10px. Mobile: hero 56→40px, stat values 30→22–24px.
- **Champion avatar ring:** list rows `box-shadow:0 0 0 1.5px #C9962E,0 0 10px rgba(201,150,46,0.35)`;
  profile avatar adds a double ring + wider glow. Non-champion avatars carry an
  `inset 0 0 0 1px rgba(255,255,255,0.14)`; shame-context avatars at `opacity:0.75`.
- **Motion (respect `prefers-reduced-motion`):** `animate-gold-pulse` (hero name
  opacity breathe, 5s) and staggered `animate-fade-in*` entrances. Hover = gold
  wash on interactive rows; nav links `#5C6270`→`gold-soft`.
- Keyboard focus: global `:focus-visible` gold ring in `globals.css`.

## Global chrome

- **Brand** (`layout/Brand.tsx`): 32px square monogram (1px gold border, inset
  gold inner border, Barlow "C" in small-metal gradient) + "CONVICTS FF" wordmark
  (5px tracking, small-metal gradient).
- **Navbar** (`layout/Navbar.tsx`): onyx `#070708`, bottom gold hairline, active
  item = white + 2px gold underline, `<GlobalSearch/>` at right.
- **Mobile top bar** (`layout/MobileMenu.tsx`): 44px hamburger (gold-soft) + 44px
  search icon. Hamburger opens a portaled drawer. **No bottom tab bar.**
- **Search strip** (`layout/SearchStrip.tsx`, home only): full-width gold-hairline
  strip on `panel-2` with gold dash, placeholder, and `⌘K` hint; opens the search overlay.
- **Footer** (`layout/Footer.tsx`, every page): centered gradient hairlines
  flanking `CONVICTS FF · 7 SEASONS`.

## Shared primitives (`components/shared/`)

| Component | Use |
|---|---|
| `PageHeader` | Radial-wash band: gold-dash kicker + hero-gradient Barlow title + tracked sub |
| `PillTabs` | Gold-underline tab row (active = white + 2px gold border), scrollable on mobile |
| `SectionCard` | Onyx card with a gold (or brick) dash header + optional action |
| `StatChip` | Hairline stat-band cell: micro-label / big Barlow value / gold-soft attribution |
| `RecordItem` | Record row: label/context left, gold-bright Barlow value right |
| `OwnerAvatar` | Owner photo/initials; gold ring for champions, dimmed for shame context |
| `PlayerHeadshot` | NFL player photo; position-badge fallback, team logo for DEF |
| `FinishBadge`, `WinPctBadge` | Season-finish square chip / threshold-colored win% numeral |
| `InfoTip` | Small ? icon beside a header or label; its definition pops up on hover, focus, or tap (portaled — table scrollers can't clip it) |
| `LoadingSpinner`, `ErrorState` | Standard page loading & error states |

Use these instead of re-rolling markup. Tables are standardized site-wide:
Barlow numerals, sage `win` / brick `loss`, `WinPctBadge` for win%, gold hover wash.

---

## Architecture

### Data flow

```
public/data/season-<year>.json     ← immutable, generated by npm run snapshot
        +
Sleeper API (current season only)
        ↓
context/LeagueContext.tsx          one load on mount → LeagueState
        ↓
lib/data-processing/               raw shapes → Matchup[], OwnerSeason[], …
        ↓
lib/stats/ · lib/preview/ · lib/search/   pure computation engines
        ↓
hooks/ (useMemo wrappers)          → pages render
```

- **Snapshot layer:** completed seasons ship as static JSON. The site makes
  zero Sleeper calls for history; only a non-snapshotted (live) season is
  fetched. If the snapshot files are missing, `LeagueContext` falls back to
  full live fetching — the snapshot is an accelerator, never a dependency.
  Each season is two files: `season-<year>.json` (every visit, ~1.3 MB for all
  seven) and `transactions-<year>.json` (loaded only by Players → Transactions).
  `players.json` (~40 KB) names every player the site shows, replacing Sleeper's
  ~15 MB player dump.
- **Everything is client-side.** Static export (`output: 'export'`), no SSR,
  no API routes, deployed to GitHub Pages under `basePath /convicts-ff-league`.

### Stat engine (`lib/stats/`)

Single source of truth for career records, championship counts (0.5 shared
titles, `winner.includes(name)` matching), H2H records (ties count for the
perspective owner), record-book extremes, power rankings, and the Luck Index
(`luck.ts`: actual wins − weekly all-play expected wins, ties ½, regular season
only — the one formula behind Seasons, Records, search, and the 2026 tab).
Locked by vitest tests.

### Search (`lib/search/` + `components/search/`)

Local natural-language query engine — tokenizer → entity matching (owners
with typo tolerance, NFL players) → regex intent table (16 intents) →
resolvers over the stat engine. No LLM, no API keys, by explicit decision.
UI is a ⌘K overlay portaled to `document.body` (the navbar's backdrop-filter
would trap a fixed overlay — don't move it back inside).

### The season tab (`lib/preview/` + `app/2026/`)

The current season's hub, named for its year, with five sub-tabs (it lands on
Power Rankings):

- **Power Rankings** — the Power Index: the Oberon Mt. power rating with all-play
  win% in place of head-to-head win%, so schedule luck can't move it
  (`0.6 × avg + 0.2 × (high + low) + 0.2 × (all-play win% × 200)`), over final
  regular-season weeks, with week-over-week movement, all-play record, streak and
  last-season flair, and the official standing alongside (`lib/stats/power-rankings.ts`).
  Power Index and All-Play are defined in `InfoTip`s on their column headers; the
  All-Play cell adds the all-play win % the baseball way (.852).
- **Matchups** — a gold-bordered **Matchup of the Week** card leads: the pairing
  with the most on the line, scored on playoff stakes (exact clinch/elimination
  conditions, else how far the result swings the playoff odds), action (projected
  closeness and total, power ranks, streaks, live closeness), and history at stake
  (series lead or tie, 💦 Daddy status, H2H streaks, title-run rematches,
  career-win milestones), with its top three reasons listed. The rest render as
  `MatchupRow`s; tapping opens `MatchupModal` (series, flair, stakes, ammo).
  **Stakes** never look at one game alone: each team's playoff odds come from
  10,000 seeded simulations of the rest of the regular season (scores drawn from
  each team's average, regressed toward the league average by a prior fit to
  league history), shown entering the week and with a win vs a loss. Once the
  math allows, exact sentences replace guesswork — "clinches a playoff spot with
  a win and a Nathan loss", "is eliminated with a loss" — true in every outcome,
  with ties in wins never counted (points for can't be known ahead). **Flair** (`lib/preview/flair.ts`, legend on the page): 💦 Daddy — wins
  75%+ of 5+ all-time meetings vs this opponent; 🔥 3+ straight wins; 🧊 3+ straight
  losses; 👑 No. 1 power ranking; 🏆 defending champ; 🚽 last season's toilet bowl;
  🚑 starting a player listed out or doubtful. **Ammo** comes from ~25 true fact
  types (series, form, power rankings, projections, live score, injuries, FAAB,
  last week's worst lineup call, milestones); order and phrasing are seeded by the
  matchup + date, so it rotates daily, holds still within a day, and a 🎲 reroll
  steps through the rest. On phones the flair moves under each name so names keep
  their width.
- **Rosters** — pick a manager from the avatar row. The header carries the Sleeper
  team name and the season line — owner · PR · record · all-play (rank) · PF (rank) ·
  PA (rank), ranks most-first across the league — with a week picker. The lineup
  table (starters, bench, and — for the current week — IR) shows each player's
  position-tinted slot, team logo, and game, then Proj (or points once the game
  kicks off), Season Rank (e.g. QB4), GP, FPTS, and PPG, all under league scoring.
  Beside it, the manager's season schedule: result, score, running record, and
  season-high/low marks for played weeks; opponents for the rest; "Matchup →" opens
  that week's game on Matchups.
- **Transactions** — every completed move this season (trades, waivers, free
  agents), filterable by type and manager, using the Players → Transactions table
  and detail modal. Past weeks load once; the current week rides the live sync.
- **Draft** — the season's draft board, every pick tinted by position
  (`POS_COLORS`), with pick numbers, owner columns pinned while the board scrolls,
  and traded picks marked with who made them.

**Live sync:** `useLiveSeason` polls Sleeper while the tab is open — matchups
(lineups + live points) every minute, league/rosters/moves every five, projections
every ten (Sleeper's own CDN cache windows) — pausing while the browser tab is
hidden. The rest of the regular-season schedule (Sleeper publishes every week's
pairings up front) loads once per visit for the playoff odds and roster schedules,
and every player's season stats refresh with Sleeper's 10-minute feed. It overlays
the global store rather than mutating it. A week counts as
final only once Sleeper's `last_scored_leg` reaches it, so a Thursday game never
makes a week look finished. **Projections use an undocumented Sleeper endpoint**
— every failure path returns null and the UI renders without projections (names
fall back to the player index). Keep it that way.

---

## Yearly ritual

1. **After the draft (new season created in Sleeper):** update `LEAGUE_ID`
   in `lib/config.ts` to the new season's league id, then rename the season tab
   for the new year: `git mv app/2026 app/2027` and update its `href`/`label` in
   `components/layout/nav-items.ts`. Run `npm run snapshot -- --players-only`
   so the new rookies have names. All live data follows automatically.
2. **After the season ends** (status flips to `complete`): run
   `npm run snapshot`, commit the new `public/data/` files. History is now
   frozen and free.

Deploy is automatic: push to `main` → GitHub Actions → GitHub Pages.
