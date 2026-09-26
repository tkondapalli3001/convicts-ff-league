// Print the Luck Index for any Sleeper league season:
//
//   node scripts/luck-index.mjs <leagueId>
//
// Runs the site's own implementation (lib/stats/luck.ts, loaded through
// Node's built-in TypeScript type stripping — Node 22.18+ / 23.6+), so the
// numbers match the Seasons standings, Records, and search exactly. Regular
// season only; for a season in progress, final weeks only.

// Silence Node's one-time "module type not specified" notice for the .ts import
process.removeAllListeners('warning')
const { computeLuckIndex } = await import('../lib/stats/luck.ts')

const SLEEPER_API = 'https://api.sleeper.app/v1'

async function fetchJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`Request failed ${res.status} for ${url}`)
  return res.json()
}

const leagueId = process.argv[2]
if (!leagueId) {
  console.error('Usage: node scripts/luck-index.mjs <leagueId>')
  process.exit(1)
}

try {
  const [league, users, rosters] = await Promise.all([
    fetchJson(`${SLEEPER_API}/league/${leagueId}`),
    fetchJson(`${SLEEPER_API}/league/${leagueId}/users`),
    fetchJson(`${SLEEPER_API}/league/${leagueId}/rosters`),
  ])

  const year = Number(league.season)
  const playoffStart = league.settings?.playoff_week_start > 0 ? league.settings.playoff_week_start : 15
  const lastWeek = league.status === 'complete'
    ? playoffStart - 1
    : Math.min(playoffStart - 1, league.settings?.last_scored_leg ?? 0)

  const nameOf = Object.fromEntries(users.map(u => [u.user_id, u.display_name || u.username || u.user_id]))
  const rosterNames = Object.fromEntries(
    rosters.map(r => [String(r.roster_id), nameOf[r.owner_id] ?? `Team ${r.roster_id}`])
  )

  const weeks = {}
  await Promise.all(
    Array.from({ length: lastWeek }, (_, i) => i + 1).map(async w => {
      weeks[w] = { matchups: await fetchJson(`${SLEEPER_API}/league/${leagueId}/matchups/${w}`), isPlayoff: false }
    })
  )

  const rows = computeLuckIndex({ [year]: weeks }, { [year]: rosterNames }, year)
  console.log(`${league.name} ${year} — weeks 1–${lastWeek}, luckiest first`)
  console.log(JSON.stringify(rows, null, 2))
} catch (error) {
  console.error('Error building Luck Index:', error.message || error)
  process.exit(1)
}
