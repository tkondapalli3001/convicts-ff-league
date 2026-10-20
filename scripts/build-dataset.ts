// npm run dataset — the league's history as tidy tables in data/ (CSV: one
// fact per row, opens in Excel, queries in DuckDB or pandas). Built from the
// committed snapshots in public/data/, Sleeper's player list and weekly
// projections, nflverse's weekly box scores and game schedule, and the
// DynastyProcess player-ID crosswalk, through the site's own functions, so
// every number matches what the site computes.
// See data/README.md for the tables. The site itself never reads data/.
//
//   npm run dataset                      download every source
//   npm run dataset -- --cache <dir>     keep downloads in <dir> and reuse them

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { gunzipSync } from 'node:zlib'
import { csvRecords, type SnapshotSeason } from '@/lib/sources'
import type { Transaction } from '@/types'
import {
  draftSlotOwners, playoffStartWeek, resolveOwnerName, nflverseStatLine, NFLVERSE_SCORING_COLUMNS, type NflverseRow,
} from '@/lib/data-processing'
import { bestLineup, gapCause, playerGapCause, scoreStats, seasonControlTotals, startingSlots } from '@/lib/stats'

const ROOT = join(__dirname, '..')
const SNAP = join(ROOT, 'public', 'data')
const OUT = join(ROOT, 'data')

interface SleeperProjection {
  player_id: string
  /** The player's NFL team that week (Sleeper's abbreviation). */
  team?: string | null
  stats?: Record<string, number> | null
  /** When Sleeper last changed this projection (epoch ms). */
  updated_at?: number | null
}

/** Sleeper's team abbreviations where nflverse's differ. */
const NFLVERSE_TEAM: Record<string, string> = { LAR: 'LA', JAC: 'JAX', WSH: 'WAS', LVR: 'LV' }

/** nflverse lists kickoffs in US Eastern time: EDT until the first Sunday of November, EST after. */
function easternToUtc(day: string, time: string): number {
  const [y, m, d] = day.split('-').map(Number)
  const firstSundayOfNov = 1 + ((7 - new Date(Date.UTC(y, 10, 1)).getUTCDay()) % 7)
  const daylight = m < 11 ? m > 2 : m === 11 && d < firstSundayOfNov
  const [hh, mm] = time.split(':').map(Number)
  return Date.UTC(y, m - 1, d, hh + (daylight ? 4 : 5), mm)
}

interface SleeperPlayer {
  full_name?: string
  first_name?: string
  last_name?: string
  position?: string
  fantasy_positions?: string[] | null
  team?: string | null
  gsis_id?: string | null
}

const readJson = <T>(file: string): T => JSON.parse(readFileSync(file, 'utf8')) as T
const isTeam = (id: string) => /^[A-Z]{2,3}$/.test(id)
const iso = (ms: number | undefined | null) => (ms ? new Date(ms).toISOString() : '')
const round2 = (n: number) => Math.round(n * 100) / 100

/** Minimal CSV: quote a field only when it needs it. */
function writeCsv(name: string, header: string[], rows: (string | number | boolean | null | undefined)[][]) {
  const cell = (v: string | number | boolean | null | undefined) => {
    const s = v == null ? '' : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const text = [header, ...rows].map(r => r.map(cell).join(',')).join('\n') + '\n'
  writeFileSync(join(OUT, name), text)
  console.log(`  ${name.padEnd(20)} ${String(rows.length).padStart(6)} rows`)
}

const cacheFlag = process.argv.indexOf('--cache')
const CACHE = cacheFlag > 0 ? process.argv[cacheFlag + 1] : null

/** A source file's bytes: from the --cache folder when it's there, else downloaded (and cached). */
async function download(url: string, name: string): Promise<Buffer> {
  const cached = CACHE ? join(CACHE, name) : null
  if (cached && existsSync(cached)) return readFileSync(cached)
  process.stdout.write(`  downloading ${name}... `)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`)
  const bytes = Buffer.from(await res.arrayBuffer())
  console.log(`${Math.round(bytes.length / 1024)} KB`)
  if (cached && CACHE) { mkdirSync(CACHE, { recursive: true }); writeFileSync(cached, bytes) }
  return bytes
}


async function main() {
  mkdirSync(OUT, { recursive: true })
  const years = readJson<{ years: number[] }>(join(SNAP, 'manifest.json')).years
  const seasons = years.map(y => readJson<SnapshotSeason>(join(SNAP, `season-${y}.json`)))
  const moves = Object.fromEntries(years.map(y => [y, Object.values(readJson<Record<string, Transaction[]>>(join(SNAP, `transactions-${y}.json`))).flat()]))
  const index = readJson<{ players: Record<string, [string, string, string | null]> }>(join(SNAP, 'players.json')).players
  console.log('Sources:')
  const dump = JSON.parse((await download('https://api.sleeper.app/v1/players/nfl', 'sleeper-players.json')).toString('utf8')) as Record<string, SleeperPlayer>
  // DynastyProcess's crosswalk fills the NFL (gsis) ids Sleeper's own list lacks
  const crosswalk = csvRecords((await download('https://github.com/dynastyprocess/data/raw/master/files/db_playerids.csv', 'db_playerids.csv')).toString('utf8'))
  const dpGsis: Record<string, string> = {}
  const sleeperOfGsis: Record<string, string> = {}
  for (const r of crosswalk) {
    if (r.sleeper_id && r.sleeper_id !== 'NA' && r.gsis_id && r.gsis_id !== 'NA') {
      dpGsis[r.sleeper_id] = r.gsis_id
      sleeperOfGsis[r.gsis_id] ??= r.sleeper_id
    }
  }
  const nflverse: Record<number, NflverseRow[]> = {}
  for (const y of years) {
    const gz = await download(`https://github.com/nflverse/nflverse-data/releases/download/stats_player/stats_player_week_${y}.csv.gz`, `stats_player_week_${y}.csv.gz`)
    nflverse[y] = csvRecords(gunzipSync(gz).toString('utf8')).filter(r => r.season_type === 'REG')
  }
  // Every kickoff, by season, week, and team
  const kickoff = new Map<string, number>()
  for (const g of csvRecords((await download('https://github.com/nflverse/nfldata/raw/master/data/games.csv', 'games.csv')).toString('utf8'))) {
    if (g.game_type !== 'REG' || !g.gameday || !g.gametime) continue
    const at = easternToUtc(g.gameday, g.gametime)
    kickoff.set(`${g.season}:${g.week}:${g.away_team}`, at)
    kickoff.set(`${g.season}:${g.week}:${g.home_team}`, at)
  }
  // Sleeper's weekly projections (the same undocumented endpoint the season tab uses)
  const qs = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'].map(pos => `position[]=${pos}`).join('&')
  const projections: Record<string, SleeperProjection[]> = {}
  for (const season of seasons) {
    for (const week of Object.keys(season.matchupsByWeek)) {
      const url = `https://api.sleeper.com/projections/nfl/${season.year}/${week}?season_type=regular&${qs}`
      projections[`${season.year}:${week}`] = JSON.parse((await download(url, `projections-${season.year}-${week}.json`)).toString('utf8'))
    }
  }

  // ── players: everyone who appears anywhere in league history ──────────────
  const ids = new Set<string>()
  for (const s of seasons) {
    for (const rows of Object.values(s.matchupsByWeek)) for (const m of rows) (m.players ?? []).forEach(id => ids.add(id))
    for (const p of s.draft?.picks ?? []) ids.add(p.player_id)
  }
  for (const y of years) for (const t of moves[y]) [...Object.keys(t.adds ?? {}), ...Object.keys(t.drops ?? {})].forEach(id => ids.add(id))
  ids.delete('0')
  const draftMeta = Object.fromEntries(seasons.flatMap(s => (s.draft?.picks ?? []).map(p => [p.player_id, p.metadata])))
  const player = (id: string) => {
    const d = dump[id], i = index[id], md = draftMeta[id]
    const name = d?.full_name || [d?.first_name, d?.last_name].filter(Boolean).join(' ') || i?.[0] ||
      [md?.first_name, md?.last_name].filter(Boolean).join(' ') || (isTeam(id) ? `${id} DEF` : `#${id}`)
    const position = isTeam(id) ? 'DEF' : d?.position || i?.[1] || md?.position || ''
    const positions = isTeam(id) ? ['DEF'] : d?.fantasy_positions?.length ? d.fantasy_positions : position ? [position] : []
    const ownGsis = d?.gsis_id?.trim() || ''
    const gsis = ownGsis || dpGsis[id] || ''
    return { name, position, positions, team: isTeam(id) ? id : d?.team ?? i?.[2] ?? '', gsis, gsisSource: ownGsis ? 'sleeper' : gsis ? 'dynastyprocess' : '' }
  }
  const positions = Object.fromEntries([...ids].map(id => [id, player(id).positions]))

  console.log(`Writing data/ from ${years[0]}–${years[years.length - 1]}:`)
  writeCsv('players.csv', ['player_id', 'name', 'position', 'fantasy_positions', 'nfl_team', 'gsis_id', 'gsis_source'],
    [...ids].sort().map(id => { const p = player(id); return [id, p.name, p.position, p.positions.join('|'), p.team, p.gsis, p.gsisSource] }))
  // League players' own ids win over the crosswalk's guess
  for (const id of ids) { const g = player(id).gsis; if (g) sleeperOfGsis[g] = id }

  const ownerWeeks: (string | number | null)[][] = []
  const lineups: (string | number | boolean | null)[][] = []
  const txRows: (string | number | null)[][] = []
  const picks: (string | number | boolean | null)[][] = []
  const control: (string | number | boolean | null)[][] = []
  const playerWeeks: (string | number | null)[][] = []
  const projected: (string | number | boolean | null)[][] = []

  for (const s of seasons) {
    const year = s.year
    const users = new Map(s.users.map(u => [u.user_id, u]))
    const ownerOf: Record<number, string> = {}
    for (const r of s.rosters) {
      const u = users.get(r.owner_id)
      ownerOf[r.roster_id] = u ? resolveOwnerName(u.user_id, u.display_name) : `Team ${r.roster_id}`
    }
    const rMap = Object.fromEntries(Object.entries(ownerOf).map(([rid, o]) => [rid, o]))
    const playoffStart = playoffStartWeek(s.league)
    const slots = startingSlots(s.league.roster_positions ?? [])

    // ── owner_weeks + lineups ───────────────────────────────────────────────
    for (const [wk, rows] of Object.entries(s.matchupsByWeek)) {
      const week = Number(wk)
      const regular = week < playoffStart
      const pts = rows.map(m => m.points).sort((a, b) => b - a)
      const above = pts[pts.length / 2 - 1], below = pts[pts.length / 2]
      const byMatch: Record<number, typeof rows> = {}
      rows.forEach(m => { if (m.matchup_id != null) (byMatch[m.matchup_id] ??= []).push(m) })
      for (const m of rows) {
        const opp = m.matchup_id != null ? byMatch[m.matchup_id]?.find(x => x.roster_id !== m.roster_id) : undefined
        const result = !opp ? '' : m.points > opp.points ? 'W' : m.points < opp.points ? 'L' : 'T'
        const median = regular && s.league.settings.league_average_match
          ? m.points > below && m.points >= above ? 'W' : m.points < above && m.points <= below ? 'L' : 'T'
          : ''
        const best = bestLineup(slots, (m.players ?? []).map(id => ({ id, positions: positions[id] ?? [], points: m.players_points?.[id] ?? 0 })))
        ownerWeeks.push([year, week, regular ? 'regular' : 'playoffs', m.roster_id, ownerOf[m.roster_id], opp ? ownerOf[opp.roster_id] : '',
          round2(m.points), opp ? round2(opp.points) : '', result, median, round2(best.points), round2(best.points - m.points), m.custom_points ?? ''])

        const bestSlot = new Map(best.slots.filter(x => x.playerId).map(x => [x.playerId as string, x.slot]))
        const startedSlot = new Map((m.starters ?? []).map((id, i) => [id, slots[i]]))
        ;(m.starters ?? []).forEach((id, i) => {
          if (id === '0') lineups.push([year, week, m.roster_id, ownerOf[m.roster_id], '', '(empty)', '', slots[i], 0, ''])
        })
        for (const id of m.players ?? []) {
          const p = player(id)
          lineups.push([year, week, m.roster_id, ownerOf[m.roster_id], id, p.name, p.positions.join('|'),
            startedSlot.get(id) ?? 'BN', round2(m.players_points?.[id] ?? 0), bestSlot.get(id) ?? ''])
        }
      }
    }

    // ── transactions: one row per player moved, failed claims included ──────
    for (const t of moves[year]) {
      const base = [year, t.leg, t.transaction_id, t.type, t.status, iso(t.created), iso(t.status_updated)]
      const owners = t.roster_ids.map(r => ownerOf[r] ?? `Team ${r}`)
      for (const [id, rid] of Object.entries(t.adds ?? {}))
        txRows.push([...base, ownerOf[rid] ?? `Team ${rid}`, 'add', id, player(id).name, t.type === 'trade' ? '' : t.settings?.waiver_bid ?? '', owners.join('|')])
      for (const [id, rid] of Object.entries(t.drops ?? {}))
        txRows.push([...base, ownerOf[rid] ?? `Team ${rid}`, 'drop', id, player(id).name, '', owners.join('|')])
    }

    // ── draft picks, with each slot's pre-trade owner ───────────────────────
    if (s.draft) {
      const slotOwner = draftSlotOwners(s.draft.draft, s.draft.picks, rMap)
      for (const p of [...s.draft.picks].sort((a, b) => a.pick_no - b.pick_no)) {
        const by = ownerOf[p.roster_id] ?? `Team ${p.roster_id}`
        const owner = slotOwner[p.draft_slot] ?? ''
        picks.push([year, p.round, p.pick_no, p.draft_slot, owner, by, owner !== by, p.player_id, player(p.player_id).name,
          p.metadata?.position ?? '', p.metadata?.team ?? '', !!p.is_keeper])
      }
    }

    // ── player_weeks: nflverse box scores, rescored with this season's rules ─
    const rostered = new Map<string, { owner: string; points: number }>()
    for (const [wk, rows] of Object.entries(s.matchupsByWeek)) {
      for (const m of rows) for (const id of m.players ?? []) rostered.set(`${wk}:${id}`, { owner: ownerOf[m.roster_id], points: m.players_points?.[id] ?? 0 })
    }
    for (const r of nflverse[year]) {
      if (!['QB', 'RB', 'WR', 'TE', 'FB', 'K'].includes(r.position)) continue
      const sid = sleeperOfGsis[r.player_id] ?? ''
      const week = Number(r.week)
      const points = scoreStats(nflverseStatLine(r), s.league.scoring_settings ?? {})
      const onRoster = sid ? rostered.get(`${week}:${sid}`) : undefined
      const diff = onRoster ? round2(points - onRoster.points) : null
      playerWeeks.push([year, week, r.player_id, sid, r.player_display_name, r.position, r.team, r.opponent_team,
        ...NFLVERSE_SCORING_COLUMNS.map(c => (r[c] === 'NA' || r[c] === '0' ? '' : r[c])), r.targets, r.carries, r.attempts,
        points, onRoster?.owner ?? '', onRoster ? round2(onRoster.points) : '', diff ?? '',
        diff ? playerGapCause(year, week, sid) ?? 'NEW - not on KNOWN_PLAYER_GAPS' : ''])
    }

    // ── projections: Sleeper's projected points for every rostered player ───
    for (const [wk, rows] of Object.entries(s.matchupsByWeek)) {
      const byPlayer = new Map((projections[`${year}:${wk}`] ?? []).map(r => [r.player_id, r]))
      for (const m of rows) {
        for (const id of m.players ?? []) {
          const proj = byPlayer.get(id)
          const team = isTeam(id) ? id : proj?.team ?? ''
          const kick = team ? kickoff.get(`${year}:${wk}:${NFLVERSE_TEAM[team] ?? team}`) : undefined
          projected.push([year, Number(wk), m.roster_id, ownerOf[m.roster_id], id, player(id).name, team,
            proj?.stats ? scoreStats(proj.stats, s.league.scoring_settings ?? {}) : '', iso(proj?.updated_at), iso(kick),
            kick && proj?.updated_at ? proj.updated_at <= kick : ''])
        }
      }
    }

    // ── control totals: our season numbers against Sleeper's ────────────────
    for (const t of seasonControlTotals(s, positions)) {
      control.push([t.season, t.owner, t.rosterId, t.metric, t.ours, t.sleeper, t.diff == null ? '' : round2(t.diff), t.ties, gapCause(t) ?? (t.ties ? '' : 'NEW — not on KNOWN_GAPS')])
    }
  }

  writeCsv('owner_weeks.csv', ['season', 'week', 'game', 'roster_id', 'owner', 'opponent', 'points', 'opponent_points', 'result', 'median_result', 'best_lineup_points', 'bench_points_left', 'custom_points'], ownerWeeks)
  writeCsv('lineups.csv', ['season', 'week', 'roster_id', 'owner', 'player_id', 'player', 'positions', 'slot', 'points', 'best_lineup_slot'], lineups)
  writeCsv('transactions.csv', ['season', 'week', 'transaction_id', 'type', 'status', 'created_utc', 'processed_utc', 'owner', 'move', 'player_id', 'player', 'faab_bid', 'owners_involved'], txRows)
  writeCsv('draft_picks.csv', ['season', 'round', 'pick_no', 'draft_slot', 'slot_owner', 'picked_by', 'traded_pick', 'player_id', 'player', 'position', 'nfl_team', 'keeper'], picks)
  writeCsv('control_totals.csv', ['season', 'owner', 'roster_id', 'metric', 'ours', 'sleeper', 'diff', 'ties', 'cause'], control)
  writeCsv('projections.csv', ['season', 'week', 'roster_id', 'owner', 'player_id', 'player', 'nfl_team', 'projected_points',
    'projection_updated_utc', 'kickoff_utc', 'before_kickoff'], projected)
  writeCsv('player_weeks.csv', ['season', 'week', 'gsis_id', 'player_id', 'player', 'position', 'nfl_team', 'opponent',
    ...NFLVERSE_SCORING_COLUMNS, 'targets', 'carries', 'pass_attempts', 'points', 'rostered_by', 'sleeper_points', 'diff', 'cause'], playerWeeks)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
