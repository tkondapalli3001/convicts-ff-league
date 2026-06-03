import { OWNER_COLORS, OWNER_FULL_NAMES } from '@/lib/constants'

// ─── Owner Utilities ──────────────────────────────────────────────────────────

export function ownerColor(name: string): string {
  for (const [k, v] of Object.entries(OWNER_COLORS)) {
    if (name && name.toLowerCase().includes(k.toLowerCase())) return v
  }
  return OWNER_COLORS.default
}

export function avatarLetters(name: string): string {
  return (name || '?').substring(0, 2).toUpperCase()
}

export function fullNameInitials(name: string): string {
  const full = OWNER_FULL_NAMES[name]
  if (full) {
    const parts = full.trim().split(' ')
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return full.substring(0, 2).toUpperCase()
  }
  return (name || '?').substring(0, 2).toUpperCase()
}

// ─── Formatting ───────────────────────────────────────────────────────────────

export function fmtPts(n: number | null | undefined): string {
  return n != null ? parseFloat(String(n)).toFixed(2) : '—'
}

export function fmtPct(w: number, l: number): string {
  const t = w + l
  return t > 0 ? ((w / t) * 100).toFixed(1) + '%' : '—'
}

export function fmtMoney(n: number): string {
  return `${n >= 0 ? '+' : ''}$${n}`
}

// ─── Win% classification ──────────────────────────────────────────────────────

export function pctClass(pct: string | number): 'good' | 'mid' | 'bad' {
  const p = parseFloat(String(pct))
  if (p >= 55) return 'good'
  if (p >= 45) return 'mid'
  return 'bad'
}

// ─── Champion / Shame lookups ─────────────────────────────────────────────────

import { MANUAL_CHAMPS, MANUAL_SHAME } from '@/lib/constants'
import type { BracketGame, LeagueState } from '@/types'

function buildSeedMap(games: BracketGame[]): Record<number, number> {
  const map: Record<number, number> = {}
  for (const g of games) {
    if (g.t1 != null && g.t1_seed != null) map[g.t1] = g.t1_seed
    if (g.t2 != null && g.t2_seed != null) map[g.t2] = g.t2_seed
  }
  return map
}

function computeRegularSeasonSeed(rosterId: number, year: number, state: LeagueState): number | null {
  const rosters = state.rosters[year]
  if (!rosters?.length) return null
  const ranked = [...rosters]
    .map(r => ({
      roster_id: r.roster_id,
      wins: r.settings?.wins ?? 0,
      pf: (r.settings?.fpts ?? 0) + (r.settings?.fpts_decimal ?? 0) / 100,
    }))
    .sort((a, b) => b.wins - a.wins || b.pf - a.pf)
  const idx = ranked.findIndex(r => r.roster_id === rosterId)
  return idx >= 0 ? idx + 1 : null
}

export function getChampion(year: number, state: LeagueState) {
  const manual = MANUAL_CHAMPS.find(c => c.year === year)
  const bracket = state.brackets[year]
  const rMap = state.rosterUserMaps[year] || {}
  const winners = bracket?.winners ?? []

  const seedMap = buildSeedMap(winners)
  const champGame = winners.find(g => g.p === 1)
    ?? (winners.length ? winners.reduce((best, g) => (g.r > best.r ? g : best)) : undefined)

  if (manual?.winner) {
    let seed: number | string | null = manual.seed ?? null
    if (seed == null && champGame?.w != null) {
      seed = seedMap[champGame.w] ?? computeRegularSeasonSeed(champGame.w, year, state)
    }
    return { ...manual, seed }
  }

  if (champGame?.w) {
    return { year, winner: rMap[String(champGame.w)] || `Team${champGame.w}`, seed: seedMap[champGame.w] ?? null }
  }
  return { year, winner: '—', seed: null }
}

export function getRunnerUp(year: number, state: LeagueState) {
  const bracket = state.brackets[year]
  const rMap = state.rosterUserMaps[year] || {}
  const winners = bracket?.winners ?? []

  const seedMap = buildSeedMap(winners)
  const champGame = winners.find(g => g.p === 1)
    ?? (winners.length ? winners.reduce((best, g) => (g.r > best.r ? g : best)) : undefined)

  if (champGame?.l != null) {
    return { year, name: rMap[String(champGame.l)] || `Team${champGame.l}`, seed: seedMap[champGame.l] ?? null }
  }
  return { year, name: '—', seed: null }
}

export function getShameLoser(year: number, state: LeagueState) {
  const manual = MANUAL_SHAME.find(s => s.year === year)
  const bracket = state.brackets[year]
  const rMap = state.rosterUserMaps[year] || {}
  const losers = bracket?.losers ?? []

  const seedMap = buildSeedMap(losers)
  const maxRound = losers.length ? Math.max(...losers.map(g => g.r)) : 0
  const toiletGame = losers.find(g => g.r === maxRound && g.p === 1)
    ?? (losers.length ? losers.reduce((best, g) => (g.r > best.r ? g : best)) : undefined)

  // Sleeper losers bracket semantics: `w` tracks the team advancing toward last place
  // (i.e., the team that LOST the game), so `w` on the final game = the actual last-place team.
  if (manual?.loser) {
    let seed: number | null = manual.seed ?? null
    if (seed == null && toiletGame?.w != null) {
      seed = seedMap[toiletGame.w] ?? computeRegularSeasonSeed(toiletGame.w, year, state)
    }
    return { ...manual, seed }
  }

  if (toiletGame?.w) {
    return { year, loser: rMap[String(toiletGame.w)] || `Team${toiletGame.w}`, seed: seedMap[toiletGame.w] ?? null }
  }
  return { year, loser: '—', seed: null }
}

// ─── Generic Sorting ──────────────────────────────────────────────────────────

export function sortBy<T>(arr: T[], key: keyof T, dir: 1 | -1 = 1): T[] {
  return [...arr].sort((a, b) => {
    let av = a[key] as unknown
    let bv = b[key] as unknown
    if (av == null) av = dir > 0 ? Infinity : -Infinity
    if (bv == null) bv = dir > 0 ? Infinity : -Infinity
    if (typeof av === 'string' && typeof bv === 'string')
      return av.localeCompare(bv) * dir
    return ((av as number) - (bv as number)) * dir
  })
}
