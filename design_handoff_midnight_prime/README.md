# Handoff: Midnight Prime — Convicts FF League Visual Redesign

## Overview
This package defines **Midnight Prime**, the new standard visual theme for the Convicts FF League website (Next.js repo: `convicts-ff-league`, branch `reimagine`). The direction is "trophy-room luxury": cinematic near-black backgrounds, metallic gold accents, hairline rules, condensed uppercase display numerals, and editorial restraint. It replaces the current "Nebula Glass" theme (violet/blue gradients, glassy rounded cards, orb glows).

The redesign was validated on three pages — **Home**, **Records**, and **Owner Profile** — in desktop (1240px) and mobile (390px) layouts. The task is to apply this theme **across the entire site** (Home, Owners, Seasons, Draft, Records, Players), using the three designed pages as the canonical reference for every pattern.

## About the Design Files
`Home Explorations.dc.html` is a **design reference created in HTML** — a prototype showing intended look and behavior, not production code to copy directly. It is a single canvas containing multiple artboards (labeled 1a–4b). **Only the Midnight Prime artboards are canonical: 2a, 2b, 3a, 3b, 4a, 4b.** Artboards 1a/1b/1c are earlier explorations — ignore them.

Your task: **recreate these designs in the existing Next.js + Tailwind codebase**, using its established patterns (components in `components/`, data from the Sleeper API via `lib/`). Keep all existing functionality, routes, and data logic — this is a reskin plus layout refinement, not a rebuild.

All stat values in the prototype are **representative placeholders**. The real site computes them from the Sleeper API — keep that wiring, only restyle presentation.

## Fidelity
**High-fidelity.** Colors, typography, spacing, and hierarchy are final. Recreate pixel-perfectly using Tailwind (extend `tailwind.config.ts` with the tokens below).

## Design Tokens

### Color palette ("Pure Onyx" backdrop + "Gold" finish — the chosen combination)
Backgrounds:
- `bg-base`: `#050506` — page background (Pure Onyx)
- `bg-nav`: `#070708` — navbar / top bars
- `bg-card`: `#0B0B0D` — cards, tables, panels
- `bg-panel`: `rgba(10,10,12,0.7)` — hero side panels
- `bg-panel-2`: `rgba(10,10,12,0.5)` — search strip, tab bars

Gold accents:
- `gold`: `#C9962E` — hairline rules, borders, active tab underline, monogram border
- `gold-soft`: `#C9A24B` — section headings, secondary gold text, icons
- `gold-dim`: `#8A7439` — muted gold (years, kbd hints, tags)
- `gold-bright`: `#E8CE8A` — emphasized values (good win%, record values, HOF names)
- Gold hairline borders: `rgba(230,190,90, 0.08–0.20)` (0.08 footer, 0.10–0.12 default, 0.14–0.16 card headers, 0.20 emphasized)
- Gold hover wash: `rgba(201,150,46, 0.04–0.05)`

Metallic gradients:
- Hero name / big display text: `linear-gradient(180deg, #F8E3A0 0%, #E8B84B 45%, #A87A22 100%)` with background-clip:text
- Wordmark / monogram / small gold lockups: `linear-gradient(180deg, #F5D67B, #C9962E)` with background-clip:text

Text:
- `text-primary`: `#EDE9E0` (warm off-white)
- `text-secondary`: `#9AA0AC` / `#8A8F9C`
- `text-muted`: `#5C6270` (labels, nav inactive)
- `text-faint`: `#3A4150` (row ranks below top-3, dashes)

Semantic:
- Win / positive: `#7FA886` (muted sage green)
- Loss / negative / shame: `#B4636B` (muted brick red); shame headings `#B4636B`, shame accents/borders `#8A4A46` and `rgba(180,90,90, 0.16–0.35)`
- W badge chip: color `#7FA886` on `rgba(127,168,134,0.12)`; L badge: `#B4636B` on `rgba(180,99,107,0.12)`
- Neutral runner-up text: `#D8D3C8`

Owner identity colors (keep existing `OWNER_COLORS` from `lib/owner-map.ts`): Teja `#3b82f6`, Daniyaal `#8b5cf6`, Nathan `#06b6d4`, Dustin `#f59e0b`, Manu `#ec4899`, Raghav `#22c55e`, Sonu `#ef4444`, Armaan `#f97316`, Hamza `#a78bfa`, Sangram `#0ea5e9`, Eric `#14b8a6`, Kerry `#d946ef`.

### Typography
- **Display / numerals**: `Barlow Condensed` (Google Fonts; weights 700, 800). ALL big numbers, names, page titles, table numerals. Uppercase, tight line-height (0.92–1), letter-spacing 1–2px on titles.
- **UI / body**: `Archivo` (weights 400–800). Labels are 9–11px, weight 600–700, uppercase, letter-spacing 1.5–6px.
- **Replace Inter entirely.**
- Scale reference (desktop): hero name 100px/0.92; page title 64px; section stat values 44px; card stat values 28–34px; table numerals 17–19px; body 12–13px; micro-labels 9–10px with 2–4px tracking. Mobile: hero 56px→40px, stat values 30px→22–24px.

### Shape & effects
- Radius: cards `6px`, page container none, avatars `50%`, badges/chips `2px` or square. **No large rounded corners, no glassmorphism, no blur, no orb glows.**
- Borders are 1px hairlines (gold-tinted per above). Depth comes from borders + background steps, not shadows.
- Champion avatar ring: `box-shadow: 0 0 0 1.5px #C9962E, 0 0 10px rgba(201,150,46,0.35)` (list rows); profile page avatar: `0 0 0 2px <bg>, 0 0 0 3.5px #C9962E, 0 0 24px rgba(201,150,46,0.35)`.
- Non-champion avatars: `inset 0 0 0 1px rgba(255,255,255,0.14)`; shame-context avatars at `opacity: 0.75`.
- Section header pattern: 20px gold hairline dash + uppercase tracked heading in gold-soft.
- Gold rule-diamond divider (hero): two 64px hairlines flanking a 5px rotated square, all `#C9962E`.
- Ghost numeral: giant Barlow Condensed number (e.g. "25", 300px desktop / 150px mobile) at `rgba(201,150,46,0.045)` behind hero, overflow hidden.
- Hero radial wash: `radial-gradient(ellipse 70% 90% at 50% -20%, rgba(201,150,46,0.10), transparent 60%)` over bg-base.

### Motion (subtle; respect `prefers-reduced-motion`)
- `goldPulse`: hero gradient name opacity 0.55→1→0.55, 5s ease-in-out infinite.
- `fadeUp`: entrance, translateY(14px)→0 + fade, 0.6s ease, 0.12s stagger for side panels.
- Hovers: gold wash `rgba(201,150,46,0.05)` on rows; nav links `#5C6270`→`#C9A24B`.

## Global Chrome

### Brand lockup
- Monogram: 32px square (26px mobile), 1px `gold` border, inset 2px inner border at `rgba(201,150,46,0.35)`, Barlow Condensed "C" in small-metal gradient.
- Wordmark: "CONVICTS FF", 12px (10px mobile), weight 700, 5px tracking, small-metal gradient text. No subline.

### Desktop navbar
`bg-nav`, bottom hairline. Lockup in left cell with right hairline border. Nav items: 10px uppercase, 2.5px tracking; inactive `#5C6270` (hover gold-soft), active `#EDE9E0` + 2px `gold` bottom border. Right side: "2019–2025 · SEASON 7" in muted 9px.

### Mobile top bar
Hamburger (44px hit area, gold-soft stroke) + lockup left; search icon (44px hit area) right. **No bottom tab bar** — navigation via hamburger menu.

### Search strip (home, under navbar)
Full-width hairline strip on `bg-panel-2`: gold dash, search icon (gold-dim), placeholder `Ask anything — "Teja vs Nathan", "Who won in 2022?", "Longest streak"…` in `#5C6270` 12px, `⌘K` kbd in 9px mono with gold hairline border. Hover: gold wash. Opens existing GlobalSearch modal.

### Footer strip (every page)
Centered: gradient hairlines flanking `CONVICTS FF – 7 SEASONS`, 8px, 5px tracking, `#5C6270`.

## Screens

### 1. Home (ref: artboards 2a desktop / 2b mobile)
Layout top→bottom: navbar → search strip → hero → 4-col stat band → 2fr/1fr grid (standings | HOF+WOS) → footer.
- **Hero**: radial gold wash + ghost "25" numeral (top-right). Left: gold dash + `SEASON 7 CHAMPION · 2025` kicker (10px, 6px tracking, gold-soft); champion name in hero gradient (100px, goldPulse); rule-diamond divider; meta row `634 MATCHUPS · 12 MANAGERS · 2019–2026` (11px, gold dot separators). Right: bordered panel (min-width 264px, bg-panel) with two stacked cells — RUNNER-UP (label gold-dim, name 27px Barlow Condensed `#D8D3C8`) and TOILET BOWL LOSER (label `#8A4A46`, name `#B4636B`). Mobile: hero stacks; runner-up/toilet becomes a 2-col band; 16px gap before stat band.
- **Stat band**: 4 cells with hairline separators (2×2 on mobile): label (9px muted) / value (44px Barlow Condensed) / attribution (10px gold-soft). Order: Most Champs (2×), All-Time High Score (197.66 · Nathan), Top Win Rate (60.2% · Daniyaal), Longest Win Streak (9W · Daniyaal). Values live from API.
- **Career standings table** (bg-card): header `ALL-TIME CAREER STANDINGS` gold-soft + hint text. Columns: No. (2-digit padded, top-3 gold-soft, rest text-faint) / Manager (avatar + name + seasons; champions get gold ring) / W–L (W `#EDE9E0`, dash faint, L `#7A828F`) / Win% (sorted col, gold underline in header; ≥55% gold-bright, 45–55% neutral, <45% brick) / Avg PPG / Titles (gold-soft, `—` if none) / Net $ (positive gold-soft, negative brick). Rows link to owner profiles. Mobile: condensed rows — rank, avatar, name + "N seasons · N× titles", right-aligned W–L + Win%.
- **Hall of Fame** card: gold-gradient heading; rows year (gold-dim) / avatar with gold ring / name (19px Barlow Condensed gold-bright) / seed right-aligned. 2022 shows "Armaan & Dustin" (co-champs). No "(shared)" note.
- **Wall of Shame** card: brick variant (borders `rgba(180,90,90,…)`, heading `#B4636B` — render slightly larger than HOF heading, 13px), avatars at 0.75 opacity, names `#B4636B`.

### 2. Records (ref: 3a / 3b)
Page header (radial wash): gold dash + `THE RECORD BOOK · 7 SEASONS` kicker, "LEAGUE RECORDS" title (64px hero gradient), sub `All-time milestones, extremes & fun stats across 7 seasons`.
Tab bar on bg-panel-2, same active/inactive treatment as navbar: **Extremes / Records / Streaks / Fun Facts / Trash Talk** (horizontally scrollable on mobile).
- **Extremes**: 2-col grid — Scoring Extremes + Matchup Records cards (label/context left, big value 28px gold-bright right). Then 140+ Point Explosions (**Top 5** all-time; rank, avatar, owner, points gold-bright, matchup meta, W/L chip) paired with per-manager counts cards (Most 140+ Games gold; Most Sub-80 Games brick). Then Sub-80 Stinkers (**Bottom 5**, brick styling, single column list). Mobile stacks all cards, one per row, including both count cards.
- **Records**: 2-col — Season Records + Career Milestones (same row pattern; milestone context can be 2 lines).
- **Streaks**: 2-col — Longest Win Streaks (count 32px `#7FA886`) / Longest Losing Streaks (count `#B4636B`, avatars 0.75), with owner + date range.
- **Fun Facts**: 2fr/1fr bento. Left: Heartbreak Hotel (brick card, "X lost to Y" rows), Dumpster Divers (gold card, "X beat Y"), Who's Your Daddy (dominator gold-bright "owns" victim brick, record + win%). Right rail: The Perfect Storm (player scores), Boom-Bust Specialist (avg + ±SD), Luck of the Draw (Lucky Charm `#7FA886` / Cosmic Punching Bag `#B4636B` with wins above/below expectation). **Mobile: each fun-fact gets its own titled card** — do not merge Boom-Bust/Daddy/Luck into one card.
- **Trash Talk**: 2-col (1-col mobile) cards: gold-ringed avatar, owner name 22px Barlow Condensed gold-bright, roast copy 12px `#9AA0AC` line-height 1.6. Keep neutral-objective, stat-grounded tone; copy in prototype is placeholder — use real `TRASH_TALK` lines from the codebase if present.

### 3. Owner Profile (ref: 4a / 4b, Kerry as sample)
- **Header** (radial wash): `← ALL OWNERS` bordered back link; 76px avatar in owner color with double gold ring + glow; `MANAGER PROFILE` kicker; name 64px hero gradient; meta `4 SEASONS · 31W–25L · 55.4% WIN RATE`. Right: badge chips (square, 1px border, 10px uppercase) — championships (gold), shame years (brick), net earnings (sage). Mobile: stacks, badges wrap under name.
- **Stat grid**: 12 cells, 4-col desktop / 2-col mobile, hairline separators. Label / value (34px Barlow Condensed, semantically colored: positive sage, negative brick, honors gold-soft) / context sub-line (10px gold-soft). Stats: Career Record, Avg PF/Game, Avg PA/Game, Net Earnings, Finals Record, Playoff Byes, Best Season, Worst Season, Top Rival, Best Game, Worst Game, Longest Win Streak.
- **Top Scorers strip**: gold dash label + wrapping chips (bg-card, hairline border): player name, position muted, points gold-soft Barlow Condensed.
- **Tabs**: Season Log / H2H Records / Game Log (N).
  - **Season Log**: table Year / Finish (bordered chip: Champion gold, Toilet Bowl brick, numeric neutral) / W (sage) / L (brick) / Win% / PF/Gm / PA/Gm (brick) / +/− (signed, colored) / Playoffs (`● Clinched` sage, `✕ Elim.` brick). Mobile: rows collapse to year + finish chip + PF/PA/playoff line, right-aligned W–L + %.
  - **H2H**: 5-col grid (2-col mobile) of cards: opponent avatar, "vs Name", W–L record (26px), win% colored by threshold.
  - **Game Log**: rows meta (`2025 W16`) / Kerry score gold-bright / "vs" opponent + score muted / W-L chip / REG-PLY type chip / signed margin colored. Paginated ("latest 10 of N").

## Interactions & Behavior
- All tabs client-side state toggles; active = 2px gold underline + white text.
- Standings rows navigate to owner profile; hover gold wash on all interactive rows.
- ⌘K opens existing global search; keep current search logic.
- Mobile hit targets ≥ 44px; tab bars horizontally scrollable.
- Entrance: fadeUp on hero/major sections once per load; goldPulse on hero names. Wrap in `prefers-reduced-motion` guard.

## State Management
No new state model. Existing data flows (Sleeper API, `lib/league-history.ts`, `lib/earnings-data.ts`, `lib/owner-map.ts`) stay. New UI state: active tab per tabbed page (local component state), hamburger menu open/close on mobile.

## Assets
- Google Fonts: `Barlow Condensed` (700, 800) and `Archivo` (400–800). Load via `next/font`.
- No image assets. Monogram/wordmark are pure CSS/HTML. Icons are inline SVG strokes (lucide-style: search, hamburger) at gold-soft.

## Files
- `Home Explorations.dc.html` — the design canvas. Canonical artboards: **2a** Home desktop, **2b** Home mobile, **3a** Records desktop, **3b** Records mobile, **4a** Owner Profile desktop, **4b** Owner Profile mobile. Ignore 1a/1b/1c (earlier explorations). Each artboard is labeled with a badge in the top-left. Inline styles in these artboards are the source of truth wherever this README is ambiguous.

## Implementation order (suggested)
1. Tokens: extend `tailwind.config.ts` + globals (fonts, colors, keyframes); replace Inter.
2. Global chrome: Navbar, mobile top bar + hamburger, search strip, footer.
3. Home page.
4. Records page.
5. Owner profile page.
6. Remaining pages (Owners index, Seasons, Draft, Players) by composing the same patterns: page header w/ kicker + gradient title, hairline cards, section-dash headings, tab bars, table treatments.
