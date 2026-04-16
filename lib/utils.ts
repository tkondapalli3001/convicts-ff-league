import { OWNER_COLORS } from '@/lib/constants'

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

export function getChampion(year: number, state: LeagueState) {
  const manual = MANUAL_CHAMPS.find(c => c.year === year)
  if (manual?.winner) return manual

  const bracket = state.brackets[year]
  const rMap = state.rosterUserMaps[year] || {}
  if (bracket?.winners?.length) {
    const champGame = bracket.winners.reduce(
      (best, g) => (g.r > best.r ? g : best),
      bracket.winners[0]
    )
    if (champGame?.w) {
      return { year, winner: rMap[String(champGame.w)] || `Team${champGame.w}`, seed: null }
    }
  }
  return { year, winner: '—', seed: null }
}

export function getShameLoser(year: number, state: LeagueState) {
  const manual = MANUAL_SHAME.find(s => s.year === year)
  if (manual?.loser) return manual

  const bracket = state.brackets[year]
  const rMap = state.rosterUserMaps[year] || {}
  if (bracket?.losers?.length) {
    const lastGame = bracket.losers.reduce(
      (best, g) => (g.r > best.r ? g : best),
      bracket.losers[0]
    )
    if (lastGame?.l) {
      return { year, loser: rMap[String(lastGame.l)] || `Team${lastGame.l}`, seed: null }
    }
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
