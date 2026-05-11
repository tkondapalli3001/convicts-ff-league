# Convicts FF League

Historical analytics archive for a 7-season Sleeper fantasy football league (2019–2025).

**Live site:** https://tkondapalli3001.github.io/convicts-ff-league

---

## What It Does

Pulls all historical data directly from the Sleeper API and presents it as a sports analytics dashboard:

- **Home** — season standings, playoff bracket, and trophy case
- **Owners** — career leaderboard and individual owner profiles with head-to-head records
- **Records** — all-time highs/lows, win/loss streaks, biggest blowouts, and rivalries
- **Game Log** — every matchup ever played with full lineup detail on click
- **Luck Index** — expected wins vs. actual wins across all seasons
- **Earnings** — all-time payout history per owner
- **Trends** — season-over-season scoring and finish trends

---

## Tech Stack

- **Next.js 16** (App Router, static export)
- **TypeScript** (strict)
- **Tailwind CSS** (custom dark theme)
- **Recharts** (trend visualizations)
- **Sleeper API** (client-side fetch, no backend)
- **GitHub Pages** (deployment)

---

## Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000/convicts-ff-league](http://localhost:3000/convicts-ff-league).

---

## Deploy

Pushes to `main` trigger the GitHub Actions workflow automatically. The site builds as a static export and deploys to GitHub Pages.

To deploy manually:

```bash
npm run build
```

The static output lands in `out/` — the workflow handles the rest.

---

## Project Structure

```
app/          Pages (Next.js App Router)
components/   Feature-organized UI components
context/      Global league data state (LeagueContext)
hooks/        Custom data hooks
lib/          Sleeper API client, data processing, static league data
types/        TypeScript interfaces
```

See [CLAUDE.md](CLAUDE.md) for full architecture details.
