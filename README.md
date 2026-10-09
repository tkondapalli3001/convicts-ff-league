# Convicts FF League

The archive and live-season hub for the Convicts, a Sleeper fantasy football league
playing since 2019. Styled in **Midnight Prime** — a "trophy-room luxury" look:
cinematic onyx backgrounds, metallic-gold hairlines, and condensed uppercase display
numerals. Built for phones first.

**Live site:** https://tkondapalli3001.github.io/convicts-ff-league

---

## What's on It

- **Home** — career standings, Hall of Fame and Wall of Shame, and an "ask anything"
  search (⌘K) that answers league questions locally, no AI service.
- **The season tab** (`/2026`) — live from Sleeper while it's open: power rankings,
  matchups with playoff odds, flair, and daily group-chat ammo, every roster with
  season stats and schedules, every move, and the draft board.
- **Owners** — career leaderboard, the earnings ledger, head-to-head records, a rivalry
  calculator, and a profile page per owner.
- **Seasons** — standings and playoff brackets, every game with box scores, finish
  history, and scoring trends.
- **Draft** — the countdown, the stock-pick draft order, every past board, slot
  analysis, steals and busts, and draft strategies.
- **Records** — the record book, career milestones, streaks, fun facts (Luck Index,
  Who's Your Daddy, and more), and trash talk.
- **Players** — win rates, scoring, draft ownership, and every transaction.

---

## How It Works

Completed seasons ship with the site as static JSON in `public/data/`, so history loads
with zero API calls. Only the season in progress comes from the Sleeper API, fetched in
the browser — there's no backend. If the snapshot files ever fail to load, the site
falls back to fetching everything from Sleeper.

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, static export) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS — Midnight Prime palette (see `DESIGN.md`) |
| Charts | Recharts |
| Data | Sleeper API + committed season snapshots |
| Tests | Vitest, ESLint, knip |
| Hosting | GitHub Pages |

---

## Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000/convicts-ff-league](http://localhost:3000/convicts-ff-league).

| Command | Purpose |
|---|---|
| `npm run build` | Static export to `out/` |
| `npm test` | Unit tests |
| `npm run lint` | ESLint |
| `npm run knip` | Unused files, exports, and dependencies |
| `npm run snapshot` | Freeze completed seasons into `public/data/` |
| `npm run snapshot -- --players-only` | Rebuild the player-name index after a draft |

---

## Deploy

Every push to `main` runs the GitHub Actions workflow, which builds the static export
and publishes it to GitHub Pages.

---

## Each Year

- **After the draft:** set `LEAGUE_ID` and `CURRENT_SEASON` in `lib/league/config.ts`,
  then run `npm run snapshot -- --players-only`.
- **After the title game:** run `npm run snapshot`, commit `public/data/`, and add the
  season's champion, toilet bowl, and earnings in `lib/league/`.

The full checklist is in [BUILD.md](BUILD.md) §3.

---

## Project Structure

```
app/          Pages (thin shells over hooks)
components/   UI, one folder per page plus shared, layout, and search
context/      The global league store (LeagueContext)
hooks/        Data hooks that feed the pages
lib/          league data, data sources, processing, the stat engine, the season-tab
              engine, and search
types/        Shared TypeScript interfaces
scripts/      Snapshot and Luck Index scripts
```

See [CLAUDE.md](CLAUDE.md) for the full map and working rules, [DESIGN.md](DESIGN.md)
for the design system, and [BUILD.md](BUILD.md) for project state and the maintenance
calendar.
