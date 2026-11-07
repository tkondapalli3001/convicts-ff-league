import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { csvRecords } from '@/lib/sources'
import { hashSeed, rng } from '@/lib/current-season'
import {
  NO_SIGNAL_STRENGTH, chanceOfLopsidedSeries, fitShrinkage, percentileOf, repeatability, scheduleSamples, shrinkRate, stickVerdict, wilsonRange,
  type SeasonValue,
} from '@/lib/stats'
import { betaCdf } from '../uncertainty'

describe('ranges', () => {
  it('gives a 45-49 record its 95% range', () => {
    const [lo, hi] = wilsonRange(45, 94)
    expect(lo).toBeCloseTo(0.381, 3)
    expect(hi).toBeCloseTo(0.579, 3)
  })

  it('stays inside 0-1 for a perfect small sample', () => {
    const [lo, hi] = wilsonRange(5, 5)
    expect(lo).toBeGreaterThan(0.5)
    expect(hi).toBe(1)
  })

  it('computes the beta distribution', () => {
    expect(betaCdf(0.3, 1, 1)).toBeCloseTo(0.3, 9)
    expect(betaCdf(0.5, 3, 3)).toBeCloseTo(0.5, 9)
    expect(betaCdf(0.25, 2, 2)).toBeCloseTo(0.15625, 9) // 3x² − 2x³
  })
})

describe('shrinkage', () => {
  const rand = rng(hashSeed('shrink-test'))
  const series = (rate: (i: number) => number, n: number, count: number) =>
    Array.from({ length: count }, (_, i) => {
      let wins = 0
      for (let g = 0; g < n; g++) if (rand() < rate(i)) wins++
      return { wins, n }
    })

  it('finds no signal in coin flips, and real differences when they exist', () => {
    const chance = fitShrinkage(series(() => 0.5, 20, 200))
    const real = fitShrinkage(series(i => (i % 2 ? 0.8 : 0.2), 20, 200))
    expect(chance).toBeGreaterThan(100)
    expect(real).toBeLessThan(10)
  })

  it('reaches the top of the scale on records exactly at the mean', () => {
    expect(fitShrinkage(Array.from({ length: 50 }, () => ({ wins: 10, n: 20 })))).toBe(NO_SIGNAL_STRENGTH)
  })

  it('pulls a 4-1 series toward even by k games at 50%', () => {
    const s = shrinkRate(4, 5, 22)
    expect(s.rate).toBeCloseTo(15 / 27, 9)
    expect(s.low).toBeLessThan(0.5)
    expect(s.pAboveHalf).toBeGreaterThan(0.5)
    expect(s.pAboveHalf).toBeLessThan(0.9)
  })

  it('counts how often coin flips look lopsided', () => {
    expect(chanceOfLopsidedSeries(5, 0.75, 5)).toBeCloseTo(12 / 32, 9) // 4-1, 5-0 either way
    expect(chanceOfLopsidedSeries(4, 0.75, 5)).toBe(0)
  })
})

describe('scheduleSamples', () => {
  // a always beats everyone; c and d split
  const weeks = [
    [{ a: 'a', b: 'b', ptsA: 150, ptsB: 100 }, { a: 'c', b: 'd', ptsA: 90, ptsB: 80 }],
    [{ a: 'a', b: 'c', ptsA: 140, ptsB: 95 }, { a: 'b', b: 'd', ptsA: 100, ptsB: 110 }],
    [{ a: 'a', b: 'd', ptsA: 130, ptsB: 120 }, { a: 'b', b: 'c', ptsA: 85, ptsB: 85 }],
  ]
  const samples = scheduleSamples(weeks, 5000, rng(hashSeed('schedule-test')))

  it('keeps every game: wins add up to the games played, in every schedule', () => {
    for (let s = 0; s < 5000; s += 500) {
      expect(Object.values(samples).reduce((a, x) => a + x[s], 0)).toBe(6)
    }
  })

  it('gives the top scorer the same wins in every schedule', () => {
    expect(new Set(samples.a).size).toBe(1)
    expect(samples.a[0]).toBe(3)
    expect(percentileOf(samples.a, 3)).toBe(50)
  })

  it('averages to all-play expected wins', () => {
    // b scores 100 (beats c, d), 100 (beats c), 85 (ties c)
    const mean = samples.b.reduce((a, x) => a + x, 0) / 5000
    expect(mean).toBeCloseTo(2 / 3 + 1 / 3 + 0.5 / 3, 1)
  })
})

describe('repeatability', () => {
  const owners = Array.from({ length: 10 }, (_, i) => `o${i}`)
  const seasons = [2019, 2020, 2021, 2022, 2023, 2024, 2025]
  const noise = rng(hashSeed('repeat-noise'))
  const rows = (ownerEffect: number): SeasonValue[] => seasons.flatMap(season => owners.map((owner, i) => ({ owner, season, value: ownerEffect * i + (noise() - 0.5) * 10 })))

  it('finds an owner effect that is there', () => {
    const rep = repeatability(rows(2), rng(hashSeed('a')), 500)
    expect(rep.r).toBeGreaterThan(0.5)
    expect(stickVerdict(rep)).toBe('sticks')
  })

  it('clears pure noise', () => {
    const rep = repeatability(rows(0), rng(hashSeed('b')), 500)
    expect(rep.low).toBeLessThan(0)
    expect(stickVerdict(rep)).not.toBe('sticks')
  })

  it("isn't fooled by a season when everyone scored more", () => {
    const drifting = seasons.flatMap(season => owners.map(owner => ({ owner, season, value: (season - 2019) * 100 + noise() * 10 })))
    expect(Math.abs(repeatability(drifting, rng(hashSeed('c')), 200).r)).toBeLessThan(0.6)
  })
})

describe('the published tables', () => {
  const ROOT = join(__dirname, '..', '..', '..')
  const table = (f: string) => csvRecords(readFileSync(join(ROOT, 'data', f), 'utf8'))

  it('ties schedule shuffling to the luck index: the average schedule is the all-play expectation', () => {
    const seasons = table('schedule_luck.csv').filter(r => r.season !== 'career')
    expect(seasons).toHaveLength(70)
    const off = seasons.filter(r => Math.abs(Number(r.mean_wins_across_schedules) - Number(r.all_play_expected_wins)) > 0.1)
    expect(off.map(r => `${r.season} ${r.owner}`)).toEqual([])
    const wrongLuck = seasons.filter(r => Math.abs(Number(r.actual_wins) - Number(r.all_play_expected_wins) - Number(r.luck_index)) > 0.011)
    expect(wrongLuck.map(r => `${r.season} ${r.owner}`)).toEqual([])
  })

  it('passes its negative control: no owner controls the points scored against them', () => {
    const stats = table('stat_repeatability.csv')
    const pa = stats.find(s => s.stat === 'Points against per game')!
    expect(pa.verdict).not.toBe('sticks')
    expect(Number(pa.odd_even_r)).toBeLessThan(0.2)
    expect(stats.find(s => s.stat === 'Luck Index')!.verdict).not.toBe('sticks')
  })
})
