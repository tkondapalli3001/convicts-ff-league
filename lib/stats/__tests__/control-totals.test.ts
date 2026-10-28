import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { csvRecords, type SnapshotSeason } from '@/lib/sources'
import type { LeagueState } from '@/types'
import { nflverseDefenseStatLine, nflverseStatLine, playoffStartWeek, resolveOwnerName } from '@/lib/data-processing'
import {
  KNOWN_DEFENSE_GAPS, KNOWN_GAPS, KNOWN_PLAYER_GAPS, computeLuckIndex, gapKey, playerGapKey, scoreStats, seasonControlTotals, BRIDGE_PARTS,
  type BridgeFile,
} from '@/lib/stats'

// The tie-outs (lib/stats/control-totals.ts) over every committed season.
// Everything is recomputed here with the site's own code: the snapshots in
// public/data/ are the source, and data/ supplies only raw inputs (each
// player's positions and nflverse's box-score columns). A new difference, or
// a documented one that stops happening, fails the run. The last block checks
// each draft pick's market price in data/draft_picks.csv against a second market.

const ROOT = join(__dirname, '..', '..', '..')
const years: number[] = JSON.parse(readFileSync(join(ROOT, 'public/data/manifest.json'), 'utf8')).years
const seasons = years.map(y => JSON.parse(readFileSync(join(ROOT, `public/data/season-${y}.json`), 'utf8')) as SnapshotSeason)
const players = csvRecords(readFileSync(join(ROOT, 'data/players.csv'), 'utf8'))
const positions = Object.fromEntries(players.map(p => [p.player_id, p.fantasy_positions.split('|').filter(Boolean)]))

/** Spearman's rank correlation; tied values share their average rank. */
function spearman(xs: number[], ys: number[]): number {
  const ranks = (v: number[]) => {
    const order = v.map((x, i) => ({ x, i })).sort((a, b) => a.x - b.x)
    const r: number[] = []
    for (let k = 0; k < order.length;) {
      let j = k
      while (j + 1 < order.length && order[j + 1].x === order[k].x) j++
      for (let t = k; t <= j; t++) r[order[t].i] = (k + j) / 2
      k = j + 1
    }
    return r
  }
  const rx = ranks(xs), ry = ranks(ys)
  const mx = rx.reduce((a, b) => a + b, 0) / rx.length, my = ry.reduce((a, b) => a + b, 0) / ry.length
  let cov = 0, vx = 0, vy = 0
  rx.forEach((r, i) => { cov += (r - mx) * (ry[i] - my); vx += (r - mx) ** 2; vy += (ry[i] - my) ** 2 })
  return cov / Math.sqrt(vx * vy)
}

describe('season totals tie out to Sleeper', () => {
  const totals = seasons.flatMap(s => seasonControlTotals(s, positions))

  it('covers every owner-season', () => {
    expect(totals.length).toBe(seasons.reduce((n, s) => n + s.rosters.length, 0) * 4)
  })

  it('ties every record, the 2024 median games included', () => {
    expect(totals.filter(t => t.metric === 'record' && !t.ties).map(gapKey)).toEqual([])
  })

  it('has no differences beyond the documented ones', () => {
    const gaps = totals.filter(t => !t.ties)
    const undocumented = gaps.filter(t => !KNOWN_GAPS[gapKey(t)]).map(t => `${gapKey(t)} ${t.diff?.toFixed(2)}`)
    expect(undocumented).toEqual([])
    const changed = gaps.filter(t => Math.abs((t.diff ?? 0) - KNOWN_GAPS[gapKey(t)].diff) > 0.005).map(gapKey)
    expect(changed).toEqual([])
  })

  it('still sees every documented difference', () => {
    const seen = new Set(totals.filter(t => !t.ties).map(gapKey))
    expect(Object.keys(KNOWN_GAPS).filter(k => !seen.has(k))).toEqual([])
  })

  it('finds no commissioner-edited scores', () => {
    const edited = seasons.flatMap(s => Object.values(s.matchupsByWeek).flat().filter(m => m.custom_points != null))
    expect(edited).toEqual([])
  })
})

describe("Sleeper's weekly player points tie out to the NFL's box scores", () => {
  const rows = csvRecords(readFileSync(join(ROOT, 'data/player_weeks.csv'), 'utf8'))
  const sleeperPoints = new Map<string, number>()
  for (const s of seasons) {
    for (const [week, ms] of Object.entries(s.matchupsByWeek)) {
      for (const m of ms) for (const [id, pts] of Object.entries(m.players_points ?? {})) sleeperPoints.set(`${s.year} ${week} ${id}`, pts)
    }
  }
  const scoring = Object.fromEntries(seasons.map(s => [s.year, s.league.scoring_settings ?? {}]))
  const compared = rows.filter(r => r.player_id && sleeperPoints.has(`${r.season} ${r.week} ${r.player_id}`))
  const diffs = compared
    .map(r => {
      const ours = scoreStats(nflverseStatLine(r), scoring[Number(r.season)])
      const theirs = sleeperPoints.get(`${r.season} ${r.week} ${r.player_id}`)!
      return { key: playerGapKey(Number(r.season), Number(r.week), r.player_id), diff: Math.round((ours - theirs) * 100) / 100 }
    })
    .filter(d => d.diff !== 0)

  it('compares the rostered offense and kickers of every season', () => {
    expect(compared.length).toBeGreaterThan(14_000)
  })

  it('has no differences beyond the documented ones', () => {
    expect(diffs.filter(d => !KNOWN_PLAYER_GAPS[d.key]).map(d => `${d.key} ${d.diff}`)).toEqual([])
    expect(diffs.filter(d => Math.abs(d.diff - KNOWN_PLAYER_GAPS[d.key].diff) > 0.005).map(d => d.key)).toEqual([])
    expect(Object.keys(KNOWN_PLAYER_GAPS).filter(k => !diffs.some(d => d.key === k))).toEqual([])
  })
})

describe("Sleeper's weekly team-defense points tie out to the NFL's box scores", () => {
  const rows = new Map(csvRecords(readFileSync(join(ROOT, 'data/defense_weeks.csv'), 'utf8')).map(r => [`${r.season} ${r.week} ${r.team}`, r]))
  const diffs: { key: string; diff: number }[] = []
  let compared = 0
  for (const s of seasons) {
    for (const [week, ms] of Object.entries(s.matchupsByWeek)) {
      for (const m of ms) {
        for (const [id, pts] of Object.entries(m.players_points ?? {})) {
          if (!/^[A-Z]{2,3}$/.test(id)) continue
          const row = rows.get(`${s.year} ${week} ${id}`)
          // No box score: a bye, or a game that never finished
          const ours = row ? scoreStats(nflverseDefenseStatLine(row), s.league.scoring_settings ?? {}) : 0
          compared++
          const diff = Math.round((ours - pts) * 100) / 100
          if (diff !== 0) diffs.push({ key: playerGapKey(s.year, Number(week), id), diff })
        }
      }
    }
  }

  it('compares every rostered team defense, byes included', () => {
    expect(compared).toBeGreaterThan(1_850)
  })

  it('has no differences beyond the documented ones', () => {
    expect(diffs.filter(d => !KNOWN_DEFENSE_GAPS[d.key]).map(d => `${d.key} ${d.diff}`)).toEqual([])
    expect(diffs.filter(d => Math.abs(d.diff - KNOWN_DEFENSE_GAPS[d.key].diff) > 0.005).map(d => d.key)).toEqual([])
    expect(Object.keys(KNOWN_DEFENSE_GAPS).filter(k => !diffs.some(d => d.key === k))).toEqual([])
  })
})

describe('every wins bridge ties out to the record and the luck index', () => {
  const file: BridgeFile = JSON.parse(readFileSync(join(ROOT, 'public/data/bridges.json'), 'utf8'))
  const ownerSeasons = seasons.reduce((n, s) => n + s.rosters.length, 0)

  it('covers every owner-season', () => {
    expect(file.bridges.length).toBe(ownerSeasons)
  })

  it('sums each bridge exactly: average team + parts = expected wins, + luck = the record', () => {
    const off = file.bridges.filter(b => {
      const parts = BRIDGE_PARTS.reduce((a, k) => a + b.parts[k].wins, 0)
      return Math.abs(b.baseline + parts - b.expected) > 0.01 || Math.abs(b.expected + b.luck - b.actual) > 0.002
    })
    expect(off.map(b => `${b.season} ${b.owner}`)).toEqual([])
  })

  it("matches the site's luck index: the same expected and actual wins", () => {
    const off: string[] = []
    for (const s of seasons) {
      const users = new Map(s.users.map(u => [u.user_id, u]))
      const rMap = Object.fromEntries(s.rosters.map(r => {
        const u = users.get(r.owner_id)
        return [String(r.roster_id), u ? resolveOwnerName(u.user_id, u.display_name) : `Team ${r.roster_id}`]
      }))
      const start = playoffStartWeek(s.league)
      const matchups = { [s.year]: Object.fromEntries(Object.entries(s.matchupsByWeek).map(([w, rows]) => [w, { matchups: rows, isPlayoff: Number(w) >= start }])) }
      for (const l of computeLuckIndex(matchups as unknown as LeagueState['matchups'], { [s.year]: rMap })) {
        const b = file.bridges.find(x => x.season === s.year && x.owner === l.owner)
        if (!b || Math.abs(b.expected - l.expectedWins) > 0.006 || b.actual !== l.actualWins) off.push(`${s.year} ${l.owner}`)
      }
    }
    expect(off).toEqual([])
  })
})

describe("every draft pick's market price holds up", () => {
  // A keeper is placed in a round, not drafted, so it says nothing about the market
  const picks = csvRecords(readFileSync(join(ROOT, 'data/draft_picks.csv'), 'utf8')).filter(p => p.keeper !== 'true')

  it('prices at least 90% of every season', () => {
    const thin = years.filter(y => {
      const season = picks.filter(p => Number(p.season) === y)
      return season.filter(p => p.adp).length < 0.9 * season.length
    })
    expect(thin).toEqual([])
  })

  it("uses Sleeper's ADP only where it averages real drafts and agrees with FFC's mocks", () => {
    for (const y of years) {
      const sleeper = picks.filter(p => Number(p.season) === y && p.adp_source === 'sleeper')
      if (!sleeper.length) continue
      // An average over thousands of drafts is rarely a whole number; a ranking always is
      expect(sleeper.filter(p => Number.isInteger(Number(p.adp))).length, `${y} whole-number ADPs`).toBeLessThan(sleeper.length / 2)
      const both = sleeper.filter(p => p.adp_ffc)
      expect(spearman(both.map(p => Number(p.adp)), both.map(p => Number(p.adp_ffc))), `${y} rank agreement with FFC`).toBeGreaterThan(0.9)
    }
  })
})
