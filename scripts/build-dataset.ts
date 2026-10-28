// npm run dataset — the league's history as tidy tables in data/ (CSV: one
// fact per row, opens in Excel, queries in DuckDB or pandas). Built from the
// committed snapshots in public/data/, Sleeper's player list, projections and
// ADP, Fantasy Football Calculator's ADP, nflverse's weekly player and team
// box scores and game schedule, and the DynastyProcess player-ID crosswalk,
// through the site's own functions, so every number matches what the site
// computes.
// See data/README.md for the tables. The site itself never reads data/; the
// one file written for it is public/data/bridges.json, each owner-season's
// wins bridge (lib/stats/bridge.ts).
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
  nflverseDefenseStatLine, NFLVERSE_DEFENSE_COLUMNS, defensePointsAllowed, defenseYardsAllowed,
} from '@/lib/data-processing'
import {
  bestLineup, defenseGapCause, gapCause, playerGapCause, scoreStats, seasonControlTotals, startingSlots,
  BRIDGE_PARTS, partRepeatability, replacementLevels, seasonTotals, splitTeamWeek, weekBridges,
  type BridgeFile, type BridgePlayer, type Channel, type OwnerSeasonBridge, type WeekTeam,
} from '@/lib/stats'

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

/**
 * Seasons whose Sleeper ADP can't be used, and why. Their picks take Fantasy
 * Football Calculator's price instead. Every other season uses Sleeper's, and
 * the tie-out tests check it against FFC's.
 */
const SLEEPER_ADP_UNUSABLE: Record<number, string> = {
  2019: 'every value is a 999 placeholder',
  2020: 'a ranking, not draft results: whole numbers, with McCaffrey, the consensus first pick, at 999',
}

/** FFC's names for players Sleeper lists differently (as nameKey writes them). */
const FFC_NAMES: Record<string, string> = { 'will fuller': 'william fuller', 'hollywood brown': 'marquise brown', 'nyheim hines': 'nyheim miller hines' }

/** A player's name for matching across sources: lowercase, no punctuation or suffix. */
const nameKey = (name: string) =>
  name.toLowerCase().replace(/[.']/g, '').replace(/-/g, ' ').replace(/\b(jr|sr|ii|iii|iv|v)\b/g, '').split(/\s+/).filter(Boolean).join(' ')

/** Fantasy Football Calculator's ADP for one season. */
interface FfcAdp {
  meta: { total_drafts: number; start_date: string; end_date: string }
  players: { name: string; position: string; team: string; adp: number }[]
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
const round3 = (n: number) => Math.round(n * 1000) / 1000

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
  const teamBoxScores: Record<number, NflverseRow[]> = {}
  for (const y of years) {
    const gz = await download(`https://github.com/nflverse/nflverse-data/releases/download/stats_player/stats_player_week_${y}.csv.gz`, `stats_player_week_${y}.csv.gz`)
    nflverse[y] = csvRecords(gunzipSync(gz).toString('utf8')).filter(r => r.season_type === 'REG')
    const team = await download(`https://github.com/nflverse/nflverse-data/releases/download/stats_team/stats_team_week_${y}.csv.gz`, `stats_team_week_${y}.csv.gz`)
    teamBoxScores[y] = csvRecords(gunzipSync(team).toString('utf8')).filter(r => r.season_type === 'REG')
  }
  // Every kickoff and final score, by season, week, and team
  const kickoff = new Map<string, number>()
  const finalScore = new Map<string, { opponent: string; opponentPoints: string }>()
  // The schedule names each team as it was that season (OAK for the 2019 Raiders), as Sleeper's defense ids do
  const scheduleName = new Map<string, string>()
  for (const g of csvRecords((await download('https://github.com/nflverse/nfldata/raw/master/data/games.csv', 'games.csv')).toString('utf8'))) {
    if (g.game_type !== 'REG') continue
    if (g.gameday && g.gametime) {
      const at = easternToUtc(g.gameday, g.gametime)
      kickoff.set(`${g.season}:${g.week}:${g.away_team}`, at)
      kickoff.set(`${g.season}:${g.week}:${g.home_team}`, at)
    }
    if (g.home_score === '' || g.home_score === 'NA') continue
    // nflverse's box scores call the 2019 Raiders LV; its schedule still says OAK
    const home = g.home_team === 'OAK' ? 'LV' : g.home_team, away = g.away_team === 'OAK' ? 'LV' : g.away_team
    finalScore.set(`${g.season}:${g.week}:${home}`, { opponent: away, opponentPoints: g.away_score })
    finalScore.set(`${g.season}:${g.week}:${away}`, { opponent: home, opponentPoints: g.home_score })
    scheduleName.set(`${g.season}:${home}`, g.home_team)
    scheduleName.set(`${g.season}:${away}`, g.away_team)
  }
  const qs = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'].map(pos => `position[]=${pos}`).join('&')
  // Each pick's market price, half-PPR ADP: Sleeper's (its season-long projection
  // rows carry it) and Fantasy Football Calculator's mock drafts
  const sleeperAdp: Record<number, Map<string, number>> = {}
  const ffcAdp: Record<number, Map<string, number>> = {}
  const ffcMeta: Record<number, FfcAdp['meta']> = {}
  for (const y of years) {
    if (!SLEEPER_ADP_UNUSABLE[y]) {
      const rows: SleeperProjection[] = JSON.parse((await download(`https://api.sleeper.com/projections/nfl/${y}?season_type=regular&${qs}`, `projections-${y}-season.json`)).toString('utf8'))
      // 999 is Sleeper's placeholder for a player too rarely drafted to have an ADP
      sleeperAdp[y] = new Map(rows.filter(r => r.stats?.adp_half_ppr != null && r.stats.adp_half_ppr < 999).map(r => [r.player_id, r.stats!.adp_half_ppr]))
    }
    // Past seasons come as 12-team mocks only, whatever team count is asked for
    const ffc: FfcAdp = JSON.parse((await download(`https://fantasyfootballcalculator.com/api/v1/adp/half-ppr?teams=12&year=${y}&position=all`, `ffc-adp-${y}.json`)).toString('utf8'))
    ffcMeta[y] = ffc.meta
    ffcAdp[y] = new Map()
    for (const p of ffc.players) {
      const key = p.position === 'DEF' ? p.team : `${FFC_NAMES[nameKey(p.name)] ?? nameKey(p.name)}|${p.position === 'PK' ? 'K' : p.position}`
      if (ffcAdp[y].has(key)) console.warn(`  FFC ${y}: more than one player matches ${key}; keeping the first`)
      else ffcAdp[y].set(key, p.adp)
    }
  }
  // Sleeper's weekly projections (the same undocumented endpoint the season tab uses)
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
  const defenseWeeks: (string | number | null)[][] = []
  const projected: (string | number | boolean | null)[][] = []
  const bridges: OwnerSeasonBridge[] = []
  const replacementBySeason: BridgeFile['replacement'] = {}

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

    // ── draft picks, with each slot's pre-trade owner and the market price ──
    if (s.draft) {
      const slotOwner = draftSlotOwners(s.draft.draft, s.draft.picks, rMap)
      const source = sleeperAdp[year] ? 'sleeper' : 'ffc'
      let priced = 0
      for (const p of [...s.draft.picks].sort((a, b) => a.pick_no - b.pick_no)) {
        const by = ownerOf[p.roster_id] ?? `Team ${p.roster_id}`
        const owner = slotOwner[p.draft_slot] ?? ''
        const position = p.metadata?.position ?? ''
        const ffc = ffcAdp[year]?.get(position === 'DEF' ? p.player_id : `${nameKey(player(p.player_id).name)}|${position}`)
        const market = source === 'sleeper' ? sleeperAdp[year]?.get(p.player_id) : ffc
        if (market != null) priced++
        picks.push([year, p.round, p.pick_no, p.draft_slot, owner, by, owner !== by, p.player_id, player(p.player_id).name, position,
          p.metadata?.team ?? '', !!p.is_keeper, market ?? '', market != null ? source : '', market != null ? round2(p.pick_no - market) : '', ffc ?? ''])
      }
      const m = ffcMeta[year]
      console.log(`  ADP ${year}: ${source === 'sleeper' ? 'Sleeper' : `FFC, ${m.total_drafts} mocks ${m.start_date} to ${m.end_date}; Sleeper's unusable: ${SLEEPER_ADP_UNUSABLE[year]}`}, ${priced} of ${s.draft.picks.length} picks priced`)
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

    // ── defense_weeks: nflverse team box scores, rescored with this season's rules ─
    // A fumble-recovery touchdown is the defense's when a defender scores it
    // (one who picked up a teammate's fumble or took a lateral included)
    const fumbleReturnTds = new Map<string, number>()
    for (const r of nflverse[year]) {
      if (!['DL', 'LB', 'DB'].includes(r.position_group) || !(Number(r.fumble_recovery_tds) > 0)) continue
      fumbleReturnTds.set(`${r.week}:${r.team}`, (fumbleReturnTds.get(`${r.week}:${r.team}`) ?? 0) + Number(r.fumble_recovery_tds))
    }
    const teamWeek = new Map(teamBoxScores[year].map(r => [`${r.week}:${r.team}`, r]))
    const defenseScores: { week: number; team: string; points: number }[] = []
    const sleeperDef = (team: string) => {
      const named = scheduleName.get(`${year}:${team}`) ?? team
      return named === 'LA' ? 'LAR' : named
    }
    for (const t of teamBoxScores[year]) {
      const game = finalScore.get(`${year}:${t.week}:${t.team}`)
      const o = game ? teamWeek.get(`${t.week}:${game.opponent}`) : undefined
      if (!game || !o) continue
      const value = (c: string) =>
        c === 'opponent_points' ? game.opponentPoints
          : c === 'fumble_return_tds' ? String(fumbleReturnTds.get(`${t.week}:${t.team}`) ?? 0)
            : c === 'opponent_fumble_return_tds' ? String(fumbleReturnTds.get(`${t.week}:${o.team}`) ?? 0)
              : c.startsWith('opponent_') ? o[c.slice('opponent_'.length)] : t[c]
      const row: NflverseRow = Object.fromEntries(NFLVERSE_DEFENSE_COLUMNS.map(c => [c, value(c)]))
      const id = sleeperDef(t.team), week = Number(t.week)
      const points = scoreStats(nflverseDefenseStatLine(row), s.league.scoring_settings ?? {})
      defenseScores.push({ week, team: id, points })
      const onRoster = rostered.get(`${week}:${id}`)
      const diff = onRoster ? round2(points - onRoster.points) : null
      defenseWeeks.push([year, week, id, sleeperDef(game.opponent), ...NFLVERSE_DEFENSE_COLUMNS.map(c => (row[c] === '0' || row[c] === 'NA' ? '' : row[c])),
        defensePointsAllowed(row), defenseYardsAllowed(row), points, onRoster?.owner ?? '', onRoster ? round2(onRoster.points) : '', diff ?? '',
        diff ? defenseGapCause(year, week, id) ?? 'NEW - not on KNOWN_DEFENSE_GAPS' : ''])
    }

    // ── projections: Sleeper's projected points for every rostered player ───
    // A player's team that week comes from nflverse (the nearest week he played),
    // since Sleeper's projection rows can carry a later team (2019's even list 2020 teams)
    const nflTeams = new Map<string, { week: number; team: string }[]>()
    for (const r of nflverse[year]) {
      const sid = sleeperOfGsis[r.player_id]
      if (sid) (nflTeams.get(sid) ?? nflTeams.set(sid, []).get(sid)!).push({ week: Number(r.week), team: r.team })
    }
    const teamThatWeek = (id: string, week: number): string | undefined => {
      const games = nflTeams.get(id)
      if (!games?.length) return undefined
      const nearest = games.reduce((a, b) => (Math.abs(b.week - week) < Math.abs(a.week - week) || (Math.abs(b.week - week) === Math.abs(a.week - week) && b.week < a.week) ? b : a))
      const named = scheduleName.get(`${year}:${nearest.team}`) ?? nearest.team
      return named === 'LA' ? 'LAR' : named
    }
    for (const [wk, rows] of Object.entries(s.matchupsByWeek)) {
      const byPlayer = new Map((projections[`${year}:${wk}`] ?? []).map(r => [r.player_id, r]))
      for (const m of rows) {
        for (const id of m.players ?? []) {
          const proj = byPlayer.get(id)
          const team = isTeam(id) ? id : teamThatWeek(id, Number(wk)) ?? proj?.team ?? ''
          const kick = team ? kickoff.get(`${year}:${wk}:${NFLVERSE_TEAM[team] ?? team}`) : undefined
          projected.push([year, Number(wk), m.roster_id, ownerOf[m.roster_id], id, player(id).name, team,
            proj?.stats ? scoreStats(proj.stats, s.league.scoring_settings ?? {}) : '', iso(proj?.updated_at), iso(kick),
            kick && proj?.updated_at ? proj.updated_at <= kick : ''])
        }
      }
    }

    // ── wins bridge: where each owner-season's wins came from ────────────────
    const scoring = s.league.scoring_settings ?? {}
    const regularWeeks = Object.keys(s.matchupsByWeek).map(Number).filter(w => w < playoffStart).sort((a, b) => a - b)
    // How a player reached a roster: its latest completed add on or before the week, else the draft
    const addedBy = new Map<string, { week: number; trade: boolean }[]>()
    for (const t of moves[year]) {
      if (t.status !== 'complete') continue
      for (const [id, rid] of Object.entries(t.adds ?? {})) {
        const k = `${rid}:${id}`
        ;(addedBy.get(k) ?? addedBy.set(k, []).get(k)!).push({ week: t.leg, trade: t.type === 'trade' })
      }
    }
    const draftedBy = new Set((s.draft?.picks ?? []).map(p => `${p.roster_id}:${p.player_id}`))
    const channelOf = (rosterId: number, id: string, week: number): Channel => {
      const last = (addedBy.get(`${rosterId}:${id}`) ?? []).filter(a => a.week <= week).sort((a, b) => b.week - a.week)[0]
      if (last) return last.trade ? 'trades' : 'pickups'
      return draftedBy.has(`${rosterId}:${id}`) ? 'draft' : 'pickups'
    }
    // Replacement level, from every NFL player's regular-season weeks
    const seasonLines: Record<string, Map<string, { total: number; games: number }>> = Object.fromEntries(['QB', 'RB', 'WR', 'TE', 'K', 'DEF'].map(pos => [pos, new Map()]))
    const addLine = (pos: string, id: string, pts: number) => {
      const lines = seasonLines[pos]
      if (!lines) return
      const l = lines.get(id) ?? { total: 0, games: 0 }
      l.total += pts
      l.games++
      lines.set(id, l)
    }
    for (const r of nflverse[year]) if (regularWeeks.includes(Number(r.week))) addLine(r.position === 'FB' ? 'RB' : r.position, r.player_id, scoreStats(nflverseStatLine(r), scoring))
    for (const d of defenseScores) if (regularWeeks.includes(d.week)) addLine('DEF', d.team, d.points)
    const flexStarts: Record<string, number> = {}
    for (const w of regularWeeks) for (const m of s.matchupsByWeek[w] ?? []) {
      ;(m.starters ?? []).forEach((id, i) => { if (slots[i] === 'FLEX' && id !== '0') flexStarts[player(id).position] = (flexStarts[player(id).position] ?? 0) + 1 })
    }
    const replacement = replacementLevels(slots, s.rosters.length, flexStarts, Object.fromEntries(Object.entries(seasonLines).map(([pos, m]) => [pos, [...m.values()]])))
    replacementBySeason[year] = replacement

    interface OwnerWeeks {
      weeks: ReturnType<typeof weekBridges>
      played: Map<string, OwnerSeasonBridge['players'][number]>
      detail: Pick<OwnerSeasonBridge, 'players' | 'raw' | 'lineupWeeks' | 'luckWeeks'>
    }
    const byOwner = new Map<string, OwnerWeeks>()
    const fresh = (): OwnerWeeks => ({ weeks: [], played: new Map(), detail: { players: [], raw: { draft: 0, pickups: 0, trades: 0, lineup: 0 }, lineupWeeks: [], luckWeeks: [] } })
    for (const w of regularWeeks) {
      const proj = new Map((projections[`${year}:${w}`] ?? []).map(r => [r.player_id, r.stats ? scoreStats(r.stats, scoring) : 0]))
      const rows = s.matchupsByWeek[w] ?? []
      const opponent = (m: (typeof rows)[number]) => (m.matchup_id != null ? rows.find(x => x.matchup_id === m.matchup_id && x.roster_id !== m.roster_id) : undefined)
      const teams: (WeekTeam & { rosterId: number; roster: BridgePlayer[]; starters: string[] })[] = rows.map(m => {
        const opp = opponent(m)
        const roster: BridgePlayer[] = (m.players ?? []).map(id => ({
          id, positions: positions[id] ?? [], projected: proj.get(id) ?? 0, actual: m.players_points?.[id] ?? 0, channel: channelOf(m.roster_id, id, w),
        }))
        return {
          owner: ownerOf[m.roster_id], points: m.points, rosterId: m.roster_id, roster, starters: (m.starters ?? []).filter(id => id !== '0'),
          result: !opp ? '' : m.points > opp.points ? 'W' : m.points < opp.points ? 'L' : 'T',
          split: splitTeamWeek(slots, roster, m.points, replacement),
        }
      })
      const week = weekBridges(teams)
      for (const t of teams) {
        const wb = week.find(b => b.owner === t.owner)
        if (!wb) continue
        const o = byOwner.get(t.owner) ?? fresh()
        o.weeks.push(wb)
        for (const ch of ['draft', 'pickups', 'trades'] as const) o.detail.raw[ch] += t.split.par[ch]
        o.detail.raw.lineup += t.split.lineup
        const byId = new Map(t.roster.map(p => [p.id, p]))
        for (const slot of t.split.plan) {
          if (!slot.playerId) continue
          const p = byId.get(slot.playerId)!
          const key = `${p.id}:${p.channel}`
          const row = o.played.get(key) ?? { name: player(p.id).name, position: player(p.id).position, channel: p.channel, starts: 0, par: 0 }
          row.starts++
          row.par += slot.par
          o.played.set(key, row)
        }
        const planned = new Set(t.split.plan.flatMap(x => (x.playerId ? [x.playerId] : [])))
        const started = t.starters.filter(id => !planned.has(id)), benched = [...planned].filter(id => !t.starters.includes(id))
        if (started.length || benched.length) {
          o.detail.lineupWeeks.push({ week: w, points: t.points, planned: t.points - t.split.lineup, started: started.map(id => player(id).name), benched: benched.map(id => player(id).name) })
        }
        o.detail.luckWeeks.push({ week: w, result: t.result, expected: wb.expected })
        byOwner.set(t.owner, o)
      }
    }
    for (const [owner, o] of byOwner) {
      const totals = seasonTotals(o.weeks)
      const leagueAverage = Object.fromEntries(BRIDGE_PARTS.map(k => [k, o.detail.raw[k] - totals.parts[k].points])) as OwnerSeasonBridge['leagueAverage']
      bridges.push({ season: year, owner, ...totals, ...o.detail, leagueAverage, players: [...o.played.values()].sort((a, b) => b.par - a.par) })
    }

    // ── control totals: our season numbers against Sleeper's ────────────────
    for (const t of seasonControlTotals(s, positions)) {
      control.push([t.season, t.owner, t.rosterId, t.metric, t.ours, t.sleeper, t.diff == null ? '' : round2(t.diff), t.ties, gapCause(t) ?? (t.ties ? '' : 'NEW — not on KNOWN_GAPS')])
    }
  }

  writeCsv('owner_weeks.csv', ['season', 'week', 'game', 'roster_id', 'owner', 'opponent', 'points', 'opponent_points', 'result', 'median_result', 'best_lineup_points', 'bench_points_left', 'custom_points'], ownerWeeks)
  writeCsv('lineups.csv', ['season', 'week', 'roster_id', 'owner', 'player_id', 'player', 'positions', 'slot', 'points', 'best_lineup_slot'], lineups)
  writeCsv('transactions.csv', ['season', 'week', 'transaction_id', 'type', 'status', 'created_utc', 'processed_utc', 'owner', 'move', 'player_id', 'player', 'faab_bid', 'owners_involved'], txRows)
  writeCsv('draft_picks.csv', ['season', 'round', 'pick_no', 'draft_slot', 'slot_owner', 'picked_by', 'traded_pick', 'player_id', 'player',
    'position', 'nfl_team', 'keeper', 'adp', 'adp_source', 'picks_after_adp', 'adp_ffc'], picks)
  writeCsv('control_totals.csv', ['season', 'owner', 'roster_id', 'metric', 'ours', 'sleeper', 'diff', 'ties', 'cause'], control)
  writeCsv('projections.csv', ['season', 'week', 'roster_id', 'owner', 'player_id', 'player', 'nfl_team', 'projected_points',
    'projection_updated_utc', 'kickoff_utc', 'before_kickoff'], projected)
  writeCsv('player_weeks.csv', ['season', 'week', 'gsis_id', 'player_id', 'player', 'position', 'nfl_team', 'opponent',
    ...NFLVERSE_SCORING_COLUMNS, 'targets', 'carries', 'pass_attempts', 'points', 'rostered_by', 'sleeper_points', 'diff', 'cause'], playerWeeks)
  writeCsv('bridges.csv', ['season', 'owner', 'weeks', 'average_team', ...BRIDGE_PARTS.flatMap(k => [k, `${k}_se`]), 'expected', 'luck', 'actual'],
    bridges.map(b => [b.season, b.owner, b.weeks, round3(b.baseline), ...BRIDGE_PARTS.flatMap(k => [round3(b.parts[k].wins), round3(b.parts[k].se)]),
      round3(b.expected), round3(b.luck), b.actual]))
  const bridgeFile: BridgeFile = {
    replacement: replacementBySeason,
    repeatability: partRepeatability(bridges.map(b => ({ owner: b.owner, season: b.season, totals: b }))),
    bridges,
  }
  writeFileSync(join(SNAP, 'bridges.json'), JSON.stringify(bridgeFile, (_, v) => (typeof v === 'number' ? round3(v) : v)))
  console.log(`  ${'../public/data/bridges.json'.padEnd(20)} ${String(bridges.length).padStart(6)} owner-seasons`)
  writeCsv('defense_weeks.csv', ['season', 'week', 'team', 'opponent', ...NFLVERSE_DEFENSE_COLUMNS, 'points_allowed', 'yards_allowed',
    'points', 'rostered_by', 'sleeper_points', 'diff', 'cause'], defenseWeeks)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
