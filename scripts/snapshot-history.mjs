// Snapshot every COMPLETED season into public/data/ as static JSON.
//
// The site loads these files instead of re-fetching immutable history from
// Sleeper on every visit; only the current (non-complete) season is fetched
// live. Run once after each season ends, then commit the output:
//
//   npm run snapshot
//
// Raw Sleeper API shapes are stored untouched so downstream processing in
// lib/data-processing is byte-identical whether data came from the snapshot
// or a live fetch.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = join(ROOT, 'public', 'data')
const SLEEPER_API = 'https://api.sleeper.app/v1'
const TX_WEEKS = 17 // matches WEEKS_PER_SEASON in hooks/useTransactionsData.ts

// Single source of truth for the league id: parse it out of lib/config.ts
const configSrc = readFileSync(join(ROOT, 'lib', 'config.ts'), 'utf8')
const LEAGUE_ID = configSrc.match(/LEAGUE_ID\s*=\s*'(\d+)'/)?.[1]
if (!LEAGUE_ID) {
  console.error('Could not find LEAGUE_ID in lib/config.ts')
  process.exit(1)
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`Request failed ${res.status} for ${url}`)
  return res.json()
}

async function snapshotSeason(league) {
  const year = parseInt(league.season)
  const id = league.league_id
  const regWeeks = league.settings?.playoff_week_start > 0 ? league.settings.playoff_week_start : 15
  const totalWeeks = league.settings?.leg > 0 ? league.settings.leg : 17
  void regWeeks // isPlayoff is derived at load time, same as the live path

  process.stdout.write(`  ${year}: matchups 1-${totalWeeks}`)
  const matchupsByWeek = {}
  await Promise.all(
    Array.from({ length: totalWeeks }, (_, i) => i + 1).map(async w => {
      matchupsByWeek[w] = await fetchJson(`${SLEEPER_API}/league/${id}/matchups/${w}`).catch(() => [])
    })
  )

  process.stdout.write(', rosters/users/brackets')
  const [users, rosters, winnersBracket, losersBracket, drafts] = await Promise.all([
    fetchJson(`${SLEEPER_API}/league/${id}/users`),
    fetchJson(`${SLEEPER_API}/league/${id}/rosters`),
    fetchJson(`${SLEEPER_API}/league/${id}/winners_bracket`).catch(() => []),
    fetchJson(`${SLEEPER_API}/league/${id}/losers_bracket`).catch(() => []),
    fetchJson(`${SLEEPER_API}/league/${id}/drafts`).catch(() => []),
  ])

  let draft = null
  if (drafts.length > 0) {
    const mainDraft = [...drafts].sort((a, b) => (b.settings?.rounds ?? 0) - (a.settings?.rounds ?? 0))[0]
    const picks = await fetchJson(`${SLEEPER_API}/draft/${mainDraft.draft_id}/picks`).catch(() => [])
    draft = { draft: mainDraft, picks }
  }

  process.stdout.write(', transactions')
  const transactionsByWeek = {}
  await Promise.all(
    Array.from({ length: TX_WEEKS }, (_, i) => i + 1).map(async w => {
      transactionsByWeek[w] = await fetchJson(`${SLEEPER_API}/league/${id}/transactions/${w}`).catch(() => [])
    })
  )

  const season = { year, league, users, rosters, matchupsByWeek, winnersBracket, losersBracket, draft, transactionsByWeek }
  const file = join(OUT_DIR, `season-${year}.json`)
  writeFileSync(file, JSON.stringify(season))
  const kb = Math.round(Buffer.byteLength(JSON.stringify(season)) / 1024)
  console.log(` → season-${year}.json (${kb} KB)`)
  return year
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true })
  console.log(`Walking league chain from ${LEAGUE_ID}…`)

  const years = []
  let lid = LEAGUE_ID
  while (lid && lid !== '0') {
    const league = await fetchJson(`${SLEEPER_API}/league/${lid}`)
    if (league.status === 'complete') {
      years.push(await snapshotSeason(league))
    } else {
      console.log(`  ${league.season}: status "${league.status}" — skipped (fetched live by the site)`)
    }
    lid = league.previous_league_id
  }

  years.sort((a, b) => a - b)
  const manifest = { generatedAt: new Date().toISOString(), years }
  writeFileSync(join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2))
  console.log(`manifest.json: ${years.join(', ')}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
