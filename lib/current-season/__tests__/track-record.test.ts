import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { csvRecords } from '@/lib/sources'
import { replaySeason, summarizeTrackRecord, type GamePick, type OddsForecast, type TrackRecord } from '@/lib/current-season'
import { calibration, scoreForecasts, type ReplayGame } from '../track-record'

describe('scoreForecasts and calibration', () => {
  it('scores a sure, right forecast 0 and a 50% guess 0.25 / ln 2', () => {
    expect(scoreForecasts([{ p: 1, y: 1 }, { p: 0, y: 0 }]).brier).toBe(0)
    const half = scoreForecasts([{ p: 0.5, y: 1 }, { p: 0.5, y: 0 }])
    expect(half.brier).toBe(0.25)
    expect(half.logLoss).toBeCloseTo(Math.LN2, 9)
  })

  it('caps the penalty for a sure, wrong forecast', () => {
    expect(scoreForecasts([{ p: 0, y: 1 }]).logLoss).toBeCloseTo(-Math.log(0.001), 9)
  })

  it('bins forecasts by tenths, the last bin including 1', () => {
    const bins = calibration([{ p: 0.31, y: 1 }, { p: 0.39, y: 0 }, { p: 1, y: 1 }])
    expect(bins[3]).toMatchObject({ n: 2, observed: 0.5 })
    expect(bins[9]).toMatchObject({ n: 1, forecast: 1, observed: 1 })
  })
})

describe('replaySeason', () => {
  const teams = ['a', 'b', 'c', 'd']
  const season = (late: number): ReplayGame[] => [
    { week: 1, a: 'a', b: 'b', ptsA: 120, ptsB: 90 }, { week: 1, a: 'c', b: 'd', ptsA: 100, ptsB: 110 },
    { week: 2, a: 'a', b: 'c', ptsA: 95, ptsB: 105 }, { week: 2, a: 'b', b: 'd', ptsA: 130, ptsB: 80 },
    { week: 3, a: 'a', b: 'd', ptsA: late, ptsB: 100 }, { week: 3, a: 'b', b: 'c', ptsA: 100, ptsB: late },
  ]
  const run = (late: number) => replaySeason({ season: 2030, games: season(late), history: [], playoffSpots: 2, made: new Set(['a', 'b']), sims: 2000 })

  it('forecasts every team every week, before that week is played', () => {
    const { odds, picks } = run(150)
    expect(odds).toHaveLength(teams.length * 3)
    expect(picks).toHaveLength(4) // weeks 2-3: week 1 has no ranking yet
  })

  it("never peeks: changing week 3's scores changes no forecast or pick made before them", () => {
    const strip = (r: ReturnType<typeof run>) => ({
      odds: r.odds.map(({ made, ...o }) => o),
      picks: r.picks.filter(p => p.week < 3),
    })
    expect(strip(run(150))).toEqual(strip(run(60)))
  })
})

describe('the published track record', () => {
  const ROOT = join(__dirname, '..', '..', '..')
  const published: TrackRecord = JSON.parse(readFileSync(join(ROOT, 'public/data/track-record.json'), 'utf8'))
  const odds: OddsForecast[] = csvRecords(readFileSync(join(ROOT, 'data/forecasts.csv'), 'utf8')).map(r => ({
    season: Number(r.season), week: Number(r.week), team: r.team, made: r.made === '1' ? 1 : 0,
    odds: Number(r.odds), recordOnly: Number(r.record_only), pointsOnly: Number(r.points_only), baseRate: Number(r.base_rate),
  }))
  const picks: GamePick[] = csvRecords(readFileSync(join(ROOT, 'data/game_picks.csv'), 'utf8')).map(r => ({
    season: Number(r.season), week: Number(r.week), a: r.team_a, b: r.team_b, oberon: Number(r.oberon), record: Number(r.record), average: Number(r.average),
  }))

  it('recomputes from the forecast rows in data/', () => {
    const last = Object.fromEntries(published.seasons.map(s => [s, Math.max(...odds.filter(o => o.season === s).map(o => o.week))]))
    const again = summarizeTrackRecord(odds, picks, new Set(published.bySeason.filter(b => b.median).map(b => b.season)), last)
    expect(again.odds.all.odds.brier).toBeCloseTo(published.odds.all.odds.brier, 3)
    expect(again.odds.early.recordOnly.brier).toBeCloseTo(published.odds.early.recordOnly.brier, 3)
    expect(again.picks.oberon.rate).toBeCloseTo(published.picks.oberon.rate, 3)
  })

  it('beats the flat base rate on every season', () => {
    expect(published.bySeason.filter(b => b.odds >= b.baseRate).map(b => b.season)).toEqual([])
  })
})
