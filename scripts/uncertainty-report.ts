// npm run uncertainty — how much of each stat on the site is signal. Reads only
// committed files (public/data/ and data/), through the site's own functions,
// and writes tables into data/ (see data/README.md). Seeded, so a rerun with
// the same inputs gives the same answer.

import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { csvRecords, type SnapshotSeason } from '@/lib/sources'
import type { Matchup } from '@/types'
import { EARNINGS_DATA } from '@/lib/league'
import { stateFromSnapshots } from '@/lib/data-processing'
import { hashSeed, rng } from '@/lib/current-season'
import {
  DADDY_MIN_GAMES, DADDY_WIN_RATE, allPlayRecords, buildChampPathGameKeys, chanceOfLopsidedSeries, computeLuckIndex, computePowerRankings, daddyOf, fitShrinkage, gameKey, h2hRecord,
  linkToWins, NO_SIGNAL_STRENGTH, pearson, percentileOf, repeatability, scheduleSamples, scheduleSeedKey, scheduleWeeks, shrinkRate, splitHalf, stickVerdict, wilsonRange,
  type BridgeFile, type ScheduleLuck, type SeasonValue, type UncertaintySummary,
} from '@/lib/stats'

const ROOT = join(__dirname, '..')
const SNAP = join(ROOT, 'public', 'data')
const OUT = join(ROOT, 'data')
const readTable = (f: string) => csvRecords(readFileSync(join(OUT, f), 'utf8'))
const round = (n: number, d = 3) => Math.round(n * 10 ** d) / 10 ** d

function writeCsv(name: string, header: string[], rows: (string | number | boolean | null | undefined)[][]) {
  const cell = (v: string | number | boolean | null | undefined) => {
    const s = v == null ? '' : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  writeFileSync(join(OUT, name), [header, ...rows].map(r => r.map(cell).join(',')).join('\n') + '\n')
  console.log(`  ${name.padEnd(26)} ${String(rows.length).padStart(5)} rows`)
}

const years: number[] = JSON.parse(readFileSync(join(SNAP, 'manifest.json'), 'utf8')).years
const seasons = years.map(y => JSON.parse(readFileSync(join(SNAP, `season-${y}.json`), 'utf8')) as SnapshotSeason)
const state = stateFromSnapshots(seasons)
const games = state.allMatchups
const ownerSeasons = state.ownerSeasons
const regular = (year: number) => games.filter(g => g.year === year && g.type === 'R')
const owners = Object.keys(ownerSeasons).sort()
const bridges: BridgeFile = JSON.parse(readFileSync(join(SNAP, 'bridges.json'), 'utf8'))

// ── Every owner-season's stats ────────────────────────────────────────────────
interface Stat { name: string; where: string; rows: SeasonValue[]; split?: { owner: string; season: number; odd: number; even: number }[] }
const stats = new Map<string, Stat>()
const add = (name: string, where: string, owner: string, season: number, value: number) => {
  const s = stats.get(name) ?? stats.set(name, { name, where, rows: [] }).get(name)!
  s.rows.push({ owner, season, value })
}
const addSplit = (name: string, owner: string, season: number, odd: number, even: number) => {
  ;(stats.get(name)!.split ??= []).push({ owner, season, odd, even })
}
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)
const sd = (xs: number[]) => { const m = mean(xs); return Math.sqrt(mean(xs.map(x => (x - m) ** 2))) }

const ownerWeeks = readTable('owner_weeks.csv')
const moves = readTable('transactions.csv').filter(t => t.move === 'add')
const picks = readTable('draft_picks.csv')

for (const year of years) {
  const reg = regular(year)
  const lastWeek = Math.max(...reg.map(g => g.week))
  const oberon = new Map(computePowerRankings(reg, lastWeek).map(r => [r.name, r]))
  const luck = new Map(computeLuckIndex({ [year]: state.matchups[year] }, state.rosterUserMaps, year).map(e => [e.owner, e]))
  // Each week's all-play share, for odd/even splits
  const byWeek = new Map<number, { name: string; pts: number }[]>()
  for (const g of reg) {
    const w = byWeek.get(g.week) ?? byWeek.set(g.week, []).get(g.week)!
    w.push({ name: g.team1, pts: g.pts1 }, { name: g.team2, pts: g.pts2 })
  }
  const allPlayShare = new Map<string, number>()
  for (const [week, teams] of byWeek) {
    const ap = allPlayRecords([teams])
    for (const t of teams) allPlayShare.set(`${week}:${t.name}`, ap[t.name]?.expectedWins ?? 0)
  }
  const keeperAdps = picks.filter(p => Number(p.season) === year && p.keeper === 'true' && p.adp).map(p => Number(p.adp))

  for (const owner of owners) {
    const season = ownerSeasons[owner].find(s => s.year === year)
    if (!season) continue
    const mine = reg.filter(g => g.team1 === owner || g.team2 === owner).map(g => {
      const us = g.team1 === owner ? g.pts1 : g.pts2, them = g.team1 === owner ? g.pts2 : g.pts1
      return { week: g.week, us, them, win: us > them ? 1 : us < them ? 0 : 0.5, ap: allPlayShare.get(`${g.week}:${owner}`) ?? 0 }
    })
    if (!mine.length) continue
    const ow = ownerWeeks.filter(r => Number(r.season) === year && r.owner === owner && r.game === 'regular')
    const part = (f: (m: (typeof mine)[number]) => number, odd: boolean) => mean(mine.filter(m => (m.week % 2 === 1) === odd).map(f))
    const row = (name: string, where: string, value: number, weekly?: (m: (typeof mine)[number]) => number) => {
      add(name, where, owner, year, value)
      if (weekly) addSplit(name, owner, year, part(weekly, true), part(weekly, false))
    }
    const bridge = bridges.bridges.find(b => b.season === year && b.owner === owner)
    const pts = mine.map(m => m.us)
    const ppts = ow.reduce((a, r) => a + Number(r.best_lineup_points), 0), pf = pts.reduce((a, b) => a + b, 0)
    row('Win rate', 'Career leaderboard, Season standings', mean(mine.map(m => m.win)), m => m.win)
    row('Points for per game', 'Career leaderboard, Season standings', mean(pts), m => m.us)
    row('Points against per game', 'Owner profile, Season standings', mean(mine.map(m => m.them)), m => m.them)
    row('All-play win rate', 'Power Rankings', mean(mine.map(m => m.ap)), m => m.ap)
    row('Luck Index', 'Season standings, Fun Facts', luck.get(owner)?.luckIndex ?? 0, m => m.win - m.ap)
    row('Oberon power rating', 'Power Rankings', oberon.get(owner)?.score ?? 0)
    row('Season finish', 'Finish Tracker, Season Log', -(season.finish ?? 11))
    row('Made the playoffs', 'Season Log', season.inPlayoffs ? 1 : 0)
    row('Highest game', 'Records', Math.max(...pts))
    row('Lowest game', 'Records', Math.min(...pts))
    row('140+ games', 'Records', pts.filter(p => p >= 140).length)
    row('Sub-80 games', 'Records', pts.filter(p => p < 80).length)
    row('Boom-bust (weekly swing)', 'Fun Facts', sd(pts))
    row('Potential points per game', 'best lineup, Rosters', ppts / mine.length)
    row('Lineup efficiency (points / potential)', 'Lineup regrets, ammo', ppts ? pf / ppts : 0)
    if (bridge) {
      row('Bridge: draft', 'Wins Bridge', bridge.parts.draft.wins)
      row('Bridge: pickups', 'Wins Bridge', bridge.parts.pickups.wins)
      row('Bridge: trades', 'Wins Bridge', bridge.parts.trades.wins)
      row('Bridge: lineup calls', 'Wins Bridge', bridge.parts.lineup.wins)
    }
    const mineMoves = moves.filter(t => Number(t.season) === year && t.owner === owner)
    row('Pickups made', 'Transactions', mineMoves.filter(t => t.status === 'complete' && (t.type === 'waiver' || t.type === 'free_agent')).length)
    row('Trades made', 'Transactions, Trades by Year', new Set(mineMoves.filter(t => t.status === 'complete' && t.type === 'trade').map(t => t.transaction_id)).size)
    // Keeper-adjusted value against the market, first ten rounds, no K or DEF
    const values = picks.filter(p => Number(p.season) === year && p.picked_by === owner && p.keeper !== 'true' && p.adp && Number(p.round) <= 10 && p.position !== 'K' && p.position !== 'DEF')
      .map(p => Number(p.pick_no) - (Number(p.adp) - keeperAdps.filter(k => k < Number(p.adp)).length))
    if (values.length) row('Draft value vs ADP', 'Steals & Busts, Past Drafts', mean(values))
    const net = EARNINGS_DATA.find(e => e.owner === owner)?.byYear[year]
    if (net != null) row('Net earnings', 'Earnings Ledger', net)
  }
}

console.log('Writing data/:')
const winRate = stats.get('Win rate')!.rows
const seedFor = (key: string) => rng(hashSeed(`uncertainty-${key}`))
const statRows = [...stats.values()].map(s => {
  const rep = repeatability(s.rows, seedFor(s.name))
  const link = linkToWins(s.rows, winRate)
  const half = s.split ? splitHalf(s.split, seedFor(`split-${s.name}`)) : null
  return { ...s, rep, link, half }
})
writeCsv('stat_repeatability.csv',
  ['stat', 'shown_on', 'verdict', 'next_season_r', 'r_low_95', 'r_high_95', 'pairs', 'next_season_p', 'owner_share', 'owner_share_p', 'odd_even_r', 'odd_even_p', 'same_season_win_r', 'next_season_win_r'],
  statRows.map(s => [s.name, s.where, stickVerdict(s.rep), round(s.rep.r), round(s.rep.low), round(s.rep.high), s.rep.pairs, round(s.rep.p), round(s.rep.ownerShare), round(s.rep.ownerP), s.half ? round(s.half.r) : '', s.half ? round(s.half.p) : '', round(s.link.sameSeason), round(s.link.nextSeason)]))

// ── Career records ────────────────────────────────────────────────────────────
const career = owners.map(owner => {
  const ss = ownerSeasons[owner]
  const wins = ss.reduce((a, s) => a + s.wins + s.ties / 2, 0), n = ss.reduce((a, s) => a + s.wins + s.losses + s.ties, 0)
  return { owner, wins, n }
}).filter(c => c.n > 0)
const careerK = fitShrinkage(career)
const careerSpread = {
  observed: sd(career.map(c => c.wins / c.n)),
  chance: Math.sqrt(mean(career.map(c => 0.25 / c.n))),
}
writeCsv('career_ranges.csv', ['owner', 'wins', 'games', 'win_rate', 'low_95', 'high_95', 'shrunk_rate', 'shrunk_low', 'shrunk_high', 'chance_above_half'],
  career.map(c => {
    const [lo, hi] = wilsonRange(c.wins, c.n), sh = shrinkRate(c.wins, c.n, careerK)
    return [c.owner, c.wins, c.n, round(c.wins / c.n), round(lo), round(hi), round(sh.rate), round(sh.low), round(sh.high), round(sh.pAboveHalf)]
  }))

// ── Head-to-head ──────────────────────────────────────────────────────────────
const pairs = new Map<string, Matchup[]>()
for (const g of games) {
  const key = [g.team1, g.team2].sort().join('|')
  ;(pairs.get(key) ?? pairs.set(key, []).get(key)!).push(g)
}
const h2hRows = [...pairs.entries()].map(([key, gs]) => {
  const [a, b] = key.split('|')
  const r = h2hRecord(gs, a, b)
  return { a, b, r, n: r.winsA + r.winsB, daddy: daddyOf(r, a, b) }
})
const h2hK = fitShrinkage(h2hRows.map(p => ({ wins: p.r.winsA, n: p.n })))
writeCsv('h2h_ranges.csv', ['leader', 'other', 'wins', 'losses', 'rate', 'low_95', 'high_95', 'shrunk_rate', 'shrunk_low', 'shrunk_high', 'chance_leader_better', 'daddy'],
  h2hRows.map(p => {
    const leadA = p.r.winsA >= p.r.winsB
    const w = leadA ? p.r.winsA : p.r.winsB
    const [lo, hi] = wilsonRange(w, p.n), sh = shrinkRate(w, p.n, h2hK)
    return { row: [leadA ? p.a : p.b, leadA ? p.b : p.a, w, p.n - w, round(w / p.n), round(lo), round(hi), round(sh.rate), round(sh.low), round(sh.high), round(sh.pAboveHalf), !!p.daddy], rate: w / p.n, n: p.n }
  }).sort((x, y) => y.rate - x.rate || y.n - x.n).map(x => x.row))

// ── Do the badges predict the next game? (only earlier games decide each one) ─
interface BadgeTest { badge: string; shownOn: string; wins: number; n: number; baseline: number | null; note: string }
const badgeTests: BadgeTest[] = []
const test = (badge: string, shownOn: string, outcomes: { win: number; expected?: number }[], note: string) => {
  const with_ = outcomes.filter(o => o.expected != null)
  badgeTests.push({ badge, shownOn, wins: outcomes.reduce((a, o) => a + o.win, 0), n: outcomes.length, baseline: with_.length ? mean(with_.map(o => o.expected!)) : null, note })
}
const daddyGames: { win: number }[] = [], leaderGames: { win: number }[] = []
for (const gs of pairs.values()) {
  const ordered = [...gs].sort((x, y) => x.year - y.year || x.week - y.week)
  ordered.forEach((g, i) => {
    const prior = ordered.slice(0, i)
    if (prior.length < 3) return
    const [a, b] = [g.team1, g.team2]
    const rec = h2hRecord(prior, a, b)
    const d = daddyOf(rec, a, b)
    if (d) daddyGames.push({ win: g.winner === d.daddy ? 1 : 0 })
    if (rec.winsA !== rec.winsB) leaderGames.push({ win: g.winner === (rec.winsA > rec.winsB ? a : b) ? 1 : 0 })
  })
}
test('💦 Daddy (75%+ over 5+ meetings)', 'Season tab, Fun Facts', daddyGames, 'Did the Daddy win the next meeting?')
test('Series leader (3+ meetings)', 'H2H grids', leaderGames, 'Did whoever led the series win the next meeting?')

const hot: { win: number; expected: number }[] = [], cold: { win: number; expected: number }[] = []
for (const year of years) {
  const reg = regular(year).sort((x, y) => x.week - y.week)
  const history = new Map<string, { results: number[]; share: number[] }>()
  const weeks = [...new Set(reg.map(g => g.week))].sort((x, y) => x - y)
  for (const week of weeks) {
    const these = reg.filter(g => g.week === week)
    for (const g of these) {
      for (const [me, us, them] of [[g.team1, g.pts1, g.pts2], [g.team2, g.pts2, g.pts1]] as const) {
        const h = history.get(me)
        const last3 = h?.results.slice(-3) ?? []
        if (last3.length === 3 && h) {
          const expected = mean(h.share)
          const win = us > them ? 1 : us < them ? 0 : 0.5
          if (last3.every(r => r === 1)) hot.push({ win, expected })
          if (last3.every(r => r === 0)) cold.push({ win, expected })
        }
      }
    }
    const ap = allPlayRecords([these.flatMap(g => [{ name: g.team1, pts: g.pts1 }, { name: g.team2, pts: g.pts2 }])])
    for (const g of these) {
      for (const [me, us, them] of [[g.team1, g.pts1, g.pts2], [g.team2, g.pts2, g.pts1]] as const) {
        const h = history.get(me) ?? history.set(me, { results: [], share: [] }).get(me)!
        h.results.push(us > them ? 1 : us < them ? 0 : 0.5)
        h.share.push(ap[me]?.expectedWins ?? 0)
      }
    }
  }
}
test('🔥 Heater (3+ straight wins)', 'Season tab', hot, 'Next game, against the all-play share the team had earned so far')
test('🧊 Ice cold (3+ straight losses)', 'Season tab', cold, 'Next game, against the all-play share the team had earned so far')

const nextSeason = (who: (s: { finish: number | null; totalRosters: number }) => boolean) => owners.flatMap(owner => ownerSeasons[owner].flatMap(s => {
  if (!who(s)) return []
  const next = ownerSeasons[owner].find(x => x.year === s.year + 1)
  return next ? [{ win: next.wins + next.ties / 2, n: next.wins + next.losses + next.ties }] : []
}))
const nextRate = (rows: { win: number; n: number }[]) => rows.flatMap(r => Array.from({ length: r.n }, (_, i) => ({ win: i < r.win ? 1 : 0 })))
test('🏆 Defending champ', 'Season tab', nextRate(nextSeason(s => s.finish === 1)), "The champion's next regular season, game by game")
test('🚽 Last-place finish', 'Season tab', nextRate(nextSeason(s => s.finish === s.totalRosters)), "The last-place team's next regular season, game by game")

// Championship-path playoff games: does the regular season's better team win?
const champPath = buildChampPathGameKeys(state)
const playoffGames: { win: number }[] = []
for (const g of games.filter(x => x.type === 'P' && champPath.has(gameKey(x.year, x.week, x.team1, x.team2)))) {
  const reg = regular(g.year)
  const ap = allPlayRecords([...new Set(reg.map(x => x.week))].map(w => reg.filter(x => x.week === w).flatMap(x => [{ name: x.team1, pts: x.pts1 }, { name: x.team2, pts: x.pts2 }])))
  const a = ap[g.team1]?.expectedWins ?? 0, b = ap[g.team2]?.expectedWins ?? 0
  if (a !== b) playoffGames.push({ win: g.winner === (a > b ? g.team1 : g.team2) ? 1 : 0 })
}
test('Better regular-season team in a playoff game', 'Brackets, titles', playoffGames, 'Title-path games: did the team with more all-play wins advance?')
writeCsv('badge_tests.csv', ['badge', 'shown_on', 'wins', 'games', 'win_rate', 'low_95', 'high_95', 'team_earned_share', 'what_it_tests'],
  badgeTests.map(b => {
    const [lo, hi] = wilsonRange(b.wins, b.n)
    return [b.badge, b.shownOn, b.wins, b.n, round(b.wins / b.n), round(lo), round(hi), b.baseline == null ? '' : round(b.baseline), b.note]
  }))

// ── Draft slot ────────────────────────────────────────────────────────────────
const slotRows: SeasonValue[] = []
for (const year of years) {
  const seen = new Set<string>()
  for (const p of picks.filter(x => Number(x.season) === year)) {
    if (!p.slot_owner || seen.has(p.slot_owner)) continue
    seen.add(p.slot_owner)
    slotRows.push({ owner: p.slot_owner, season: year, value: Number(p.draft_slot) })
  }
}
const slotLink = linkToWins(slotRows, winRate)
const slotP = (() => {
  const rand = seedFor('draft-slot')
  const pairsOf = (rows: SeasonValue[]) => linkToWins(rows, winRate).sameSeason
  const observed = Math.abs(pairsOf(slotRows))
  let hits = 0
  for (let i = 0; i < 2000; i++) {
    const shuffled = years.flatMap(y => {
      const these = slotRows.filter(r => r.season === y), values = these.map(r => r.value)
      for (let j = values.length - 1; j > 0; j--) {
        const k = Math.floor(rand() * (j + 1))
        ;[values[j], values[k]] = [values[k], values[j]]
      }
      return these.map((r, idx) => ({ ...r, value: values[idx] }))
    })
    if (Math.abs(pairsOf(shuffled)) >= observed) hits++
  }
  return (hits + 1) / 2001
})()

// ── Player win rates ──────────────────────────────────────────────────────────
const names = new Map(readTable('players.csv').map(p => [p.player_id, { name: p.name, position: p.position }]))
const playerStarts = new Map<string, { win: number; team: number }[]>()
for (const s of seasons) {
  const rMap = state.rosterUserMaps[s.year]
  const seasonRate = (roster: number) => {
    const owner = rMap[String(roster)]
    const os = ownerSeasons[owner]?.find(x => x.year === s.year)
    return os ? (os.wins + os.ties / 2) / Math.max(1, os.wins + os.losses + os.ties) : 0.5
  }
  for (const rows of Object.values(s.matchupsByWeek)) {
    const groups: Record<number, typeof rows> = {}
    for (const m of rows) if (m.matchup_id != null) (groups[m.matchup_id] ??= []).push(m)
    for (const pair of Object.values(groups)) {
      if (pair.length !== 2) continue
      const [a, b] = pair
      const aWon = (a.points ?? 0) >= (b.points ?? 0)
      for (const [m, won] of [[a, aWon], [b, !aWon]] as const) {
        for (const id of m.starters ?? []) {
          if (!id || id === '0') continue
          ;(playerStarts.get(id) ?? playerStarts.set(id, []).get(id)!).push({ win: won ? 1 : 0, team: seasonRate(m.roster_id) })
        }
      }
    }
  }
}
const shown = [...playerStarts.entries()].filter(([, s]) => s.length >= 10).map(([id, s]) => {
  const wins = s.reduce((a, x) => a + x.win, 0)
  return { id, n: s.length, wins, rate: wins / s.length, team: mean(s.map(x => x.team)), starts: s }
})
const pool = shown.reduce((a, p) => a + p.wins, 0) / shown.reduce((a, p) => a + p.n, 0)
const playerK = fitShrinkage(shown, pool)
writeCsv('player_win_rates.csv', ['player_id', 'player', 'position', 'starts', 'wins', 'win_rate', 'low_95', 'high_95', 'shrunk_rate', 'team_season_rate'],
  shown.sort((a, b) => b.rate - a.rate).map(p => {
    const [lo, hi] = wilsonRange(p.wins, p.n), sh = shrinkRate(p.wins, p.n, playerK, pool)
    return [p.id, names.get(p.id)?.name ?? p.id, names.get(p.id)?.position ?? '', p.n, p.wins, round(p.rate), round(lo), round(hi), round(sh.rate), round(p.team)]
  }))
const big = shown.filter(p => p.n >= 20)
const oddEven = big.map(p => {
  const at = (rem: number) => mean(p.starts.filter((_, i) => i % 2 === rem).map(x => x.win))
  return [at(1), at(0)] as const
})
const playerExcess = shown.map(p => (p.rate - p.team) / Math.sqrt(Math.max(0.01, p.team * (1 - p.team)) / p.n))

// ── Luck against every schedule ───────────────────────────────────────────────
const SIMS = 10_000
const careerSamples = new Map<string, Float64Array>()
const careerActual = new Map<string, number>()
const luckRows: (string | number)[][] = []
const luckSummary: Record<string, Record<string, ScheduleLuck>> = {}
for (const year of years) {
  const reg = regular(year)
  const samples = scheduleSamples(scheduleWeeks(reg), SIMS, rng(hashSeed(scheduleSeedKey(year))))
  const luck = new Map(computeLuckIndex({ [year]: state.matchups[year] }, state.rosterUserMaps, year).map(e => [e.owner, e]))
  for (const [owner, sample] of Object.entries(samples)) {
    const e = luck.get(owner)!
    const sorted = [...sample].sort((a, b) => a - b)
    ;(luckSummary[year] ??= {})[owner] = { actual: e.actualWins, avg: round(mean(sorted), 2), pct: round(percentileOf(sample, e.actualWins), 1) }
    luckRows.push([year, owner, e.actualWins, round(mean(sorted), 2), e.expectedWins, e.luckIndex, sorted[Math.floor(SIMS * 0.05)], sorted[Math.floor(SIMS * 0.95)], round(percentileOf(sample, e.actualWins), 1)])
    const total = careerSamples.get(owner) ?? careerSamples.set(owner, new Float64Array(SIMS)).get(owner)!
    for (let i = 0; i < SIMS; i++) total[i] += sample[i]
    careerActual.set(owner, (careerActual.get(owner) ?? 0) + e.actualWins)
  }
}
const careerLuck = [...careerSamples.entries()].map(([owner, sample]) => {
  const sorted = [...sample].sort((a, b) => a - b)
  const actual = careerActual.get(owner)!, avg = mean(sorted)
  return { owner, actual, avg, low: sorted[Math.floor(SIMS * 0.05)], high: sorted[Math.floor(SIMS * 0.95)], pct: percentileOf(sample, actual) }
}).sort((a, b) => a.pct - b.pct)
luckSummary.career = Object.fromEntries(careerLuck.map(c => [c.owner, { actual: c.actual, avg: round(c.avg, 2), pct: round(c.pct, 1) }]))
for (const c of careerLuck) luckRows.push(['career', c.owner, c.actual, round(c.avg, 2), round(c.avg, 2), round(c.actual - c.avg, 2), c.low, c.high, round(c.pct, 1)])
writeCsv('schedule_luck.csv', ['season', 'owner', 'actual_wins', 'mean_wins_across_schedules', 'all_play_expected_wins', 'luck_index', 'p5_wins', 'p95_wins', 'percentile'], luckRows)

// ── What the site quotes ──────────────────────────────────────────────────────
const badgeRow = (name: string) => {
  const b = badgeTests.find(x => x.badge.includes(name))!
  return { wins: b.wins, n: b.n, rate: round(b.wins / b.n), earned: b.baseline == null ? null : round(b.baseline) }
}
const daddyChance = h2hRows.reduce((a, p) => a + chanceOfLopsidedSeries(p.n, DADDY_WIN_RATE, DADDY_MIN_GAMES), 0)
const summary: UncertaintySummary = {
  careerK, h2hK, sims: SIMS,
  daddies: { count: h2hRows.filter(p => p.daddy).length, byChance: round(daddyChance, 1) },
  badges: { daddy: badgeRow('Daddy'), heater: badgeRow('Heater'), cold: badgeRow('Ice cold'), champ: badgeRow('Defending champ'), last: badgeRow('Last-place') },
  players: {
    count: shown.length,
    oddEvenR: round(pearson(oddEven.map(x => x[0]), oddEven.map(x => x[1])), 2),
    beyondTeam: playerExcess.filter(z => Math.abs(z) > 1.96).length,
    chanceBeyond: Math.round(playerExcess.length * 0.05),
  },
  luck: luckSummary,
}
writeFileSync(join(SNAP, 'uncertainty.json'), JSON.stringify(summary) + '\n')
console.log(`  ${'../public/data/uncertainty.json'.padEnd(26)}`)

// ── Summary ───────────────────────────────────────────────────────────────────
console.log('\nDoes it stick to the owner? (season-centered; p from shuffling owners within seasons)')
for (const s of statRows) {
  console.log(`  ${s.name.padEnd(40)} next r ${s.rep.r.toFixed(2).padStart(5)} p ${s.rep.p.toFixed(3)} | owner share ${s.rep.ownerShare.toFixed(2)} p ${s.rep.ownerP.toFixed(3)} | odd/even ${s.half ? `${s.half.r.toFixed(2).padStart(5)} p ${s.half.p.toFixed(3)}` : '     -       '} | wins now ${s.link.sameSeason.toFixed(2).padStart(5)} next ${s.link.nextSeason.toFixed(2).padStart(5)}`)
}
console.log(`\nDraft slot (1 = first pick) vs win rate: same season r ${slotLink.sameSeason.toFixed(2)}, n ${slotRows.length}, p ${slotP.toFixed(2)}`)
console.log(`\nCareer win rate: spread ${careerSpread.observed.toFixed(3)} vs ${careerSpread.chance.toFixed(3)} from chance alone; shrinkage k = ${careerK.toFixed(0)}${careerK >= NO_SIGNAL_STRENGTH ? ' (no signal)' : ''}`)
console.log(`H2H shrinkage k = ${h2hK.toFixed(0)}${h2hK >= NO_SIGNAL_STRENGTH ? ' (no signal)' : ''}, ${h2hRows.length} pairs, ${h2hRows.filter(p => p.daddy).length} Daddies; coin flips would make ${daddyChance.toFixed(1)}`)
console.log('\nBadges and the next game:')
for (const b of badgeTests) {
  const [lo, hi] = wilsonRange(b.wins, b.n)
  console.log(`  ${b.badge.padEnd(46)} ${b.wins}/${b.n} = ${(100 * b.wins / b.n).toFixed(1)}% (${(100 * lo).toFixed(0)}-${(100 * hi).toFixed(0)})${b.baseline != null ? `, had earned ${(100 * b.baseline).toFixed(1)}%` : ''}`)
}
console.log(`\nPlayer win rates: ${shown.length} players with 10+ starts; pool ${pool.toFixed(3)}; shrinkage k = ${playerK.toFixed(0)}`)
console.log(`  win rate vs their teams' season win rate: r ${pearson(shown.map(p => p.rate), shown.map(p => p.team)).toFixed(2)}`)
console.log(`  odd vs even starts (20+ starts, ${big.length} players): r ${pearson(oddEven.map(x => x[0]), oddEven.map(x => x[1])).toFixed(2)}`)
console.log(`  beyond the team's own rate: |z|>1.96 for ${playerExcess.filter(z => Math.abs(z) > 1.96).length} of ${playerExcess.length}`)
console.log('\nCareer luck across 10,000 schedules per season:')
for (const c of careerLuck) console.log(`  ${c.owner.padEnd(10)} ${String(c.actual).padStart(5)} wins, schedules average ${c.avg.toFixed(1)} (5-95%: ${c.low}-${c.high}), percentile ${c.pct.toFixed(1)}`)
