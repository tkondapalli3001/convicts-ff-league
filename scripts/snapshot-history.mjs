// Snapshot every COMPLETED season into public/data/ as static JSON.
//
// The site loads these files instead of re-fetching immutable history from
// Sleeper on every visit; only the current (non-complete) season is fetched
// live. Run once after each season ends, then commit the output:
//
//   npm run snapshot                     all completed seasons + players.json
//   npm run snapshot -- --players-only   rebuild players.json only (run after
//                                        each draft so rookies have names)
//
// Per season: season-<year>.json (league, users, rosters, matchups, brackets,
// draft — loaded on every visit) and transactions-<year>.json (only the
// Players → Transactions tab needs them, so they load lazily). players.json is
// a trimmed name index standing in for Sleeper's ~15 MB player dump.
//
// Raw Sleeper API shapes are stored untouched so downstream processing in
// lib/data-processing is byte-identical whether data came from the snapshot
// or a live fetch.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
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

  const season = { year, league, users, rosters, matchupsByWeek, winnersBracket, losersBracket, draft }
  const kb = writeJson(`season-${year}.json`, season)
  const txKb = writeJson(`transactions-${year}.json`, transactionsByWeek)
  console.log(` → season-${year}.json (${kb} KB) + transactions-${year}.json (${txKb} KB)`)
  return year
}

/** Minified JSON into public/data/; returns the size in KB. */
function writeJson(name, data) {
  const text = JSON.stringify(data)
  writeFileSync(join(OUT_DIR, name), text)
  return Math.round(Buffer.byteLength(text) / 1024)
}

function readJson(name) {
  return JSON.parse(readFileSync(join(OUT_DIR, name), 'utf8'))
}

const FANTASY_POSITIONS = new Set(['QB', 'RB', 'WR', 'TE', 'K', 'DEF'])

/**
 * players.json — { generatedAt, players: { [id]: [name, position, team] } }
 * covering every player in the snapshotted seasons plus every active NFL
 * player at a fantasy position (so the live season resolves too). Built from
 * Sleeper's full dump, which the site then never has to download.
 */
async function writePlayersIndex(years) {
  const ids = new Set()
  const drafted = {}
  for (const year of years) {
    const s = readJson(`season-${year}.json`)
    for (const rows of Object.values(s.matchupsByWeek)) {
      for (const m of rows) {
        m.players?.forEach(p => ids.add(p))
        m.starters?.forEach(p => ids.add(p))
        Object.keys(m.players_points ?? {}).forEach(p => ids.add(p))
      }
    }
    for (const r of s.rosters) {
      for (const p of [...(r.players ?? []), ...(r.reserve ?? []), ...(r.taxi ?? [])]) ids.add(p)
    }
    for (const pick of s.draft?.picks ?? []) {
      ids.add(pick.player_id)
      drafted[pick.player_id] = pick.metadata
    }
    const txFile = `transactions-${year}.json`
    if (existsSync(join(OUT_DIR, txFile))) {
      for (const txs of Object.values(readJson(txFile))) {
        for (const t of txs) {
          Object.keys(t.adds ?? {}).forEach(p => ids.add(p))
          Object.keys(t.drops ?? {}).forEach(p => ids.add(p))
        }
      }
    }
  }
  ids.delete('0')

  process.stdout.write('Fetching Sleeper player dump…')
  const dump = await fetchJson(`${SLEEPER_API}/players/nfl`)
  for (const [id, p] of Object.entries(dump)) {
    if (p.active && p.team && FANTASY_POSITIONS.has(p.position)) ids.add(id)
  }

  const players = {}
  for (const id of [...ids].sort()) {
    const p = dump[id]
    if (p) {
      const name = p.full_name || `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim()
      players[id] = [name || `#${id}`, p.position ?? p.fantasy_positions?.[0] ?? '', p.team ?? null]
    } else if (drafted[id]) {
      // Gone from Sleeper's dump — keep the draft-day name
      const md = drafted[id]
      players[id] = [`${md.first_name ?? ''} ${md.last_name ?? ''}`.trim() || `#${id}`, md.position ?? '', md.team ?? null]
    } else if (/^[A-Z]{2,3}$/.test(id)) {
      // A relocated team's defense (e.g. OAK) — keyed by its old abbreviation
      players[id] = [id, 'DEF', id]
    }
  }

  const kb = writeJson('players.json', { generatedAt: new Date().toISOString(), players })
  console.log(` → players.json (${Object.keys(players).length} players, ${kb} KB)`)
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true })

  if (process.argv.includes('--players-only')) {
    await writePlayersIndex(readJson('manifest.json').years)
    return
  }

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

  await writePlayersIndex(years)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
