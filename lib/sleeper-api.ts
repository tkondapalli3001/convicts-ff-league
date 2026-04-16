import { LEAGUE_ID, SLEEPER_API } from '@/lib/constants'
import type { SleeperLeague, SleeperUser, SleeperRoster, SleeperMatchup, BracketGame, LeagueChainEntry } from '@/types'

// ─── Core fetch wrapper ────────────────────────────────────────────────────────

export async function sleepFetch<T>(url: string): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
    clearTimeout(timeout)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json() as Promise<T>
  } catch (err) {
    clearTimeout(timeout)
    if ((err as Error).name === 'AbortError') throw new Error(`Request timed out: ${url}`)
    const msg = (err as Error).message
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('CORS')) {
      throw new Error('CORS_BLOCKED')
    }
    throw err
  }
}

// ─── League chain (walks backward via previous_league_id) ─────────────────────

export async function buildLeagueChain(
  onProgress?: (msg: string) => void
): Promise<LeagueChainEntry[]> {
  const chain: LeagueChainEntry[] = []
  let lid: string | null = LEAGUE_ID

  while (lid && lid !== '0') {
    try {
      const lg: SleeperLeague = await sleepFetch<SleeperLeague>(`${SLEEPER_API}/league/${lid}`)
      const yr = parseInt(lg.season)
      if (!chain.find(c => c.id === lid || c.year === yr)) {
        chain.unshift({ id: lid, year: yr, data: lg })
        onProgress?.(`Found ${yr} season...`)
      }
      lid = lg.previous_league_id
      if (!lid || lid === '0') break
    } catch {
      break
    }
  }

  chain.sort((a, b) => a.year - b.year)
  return chain
}

// ─── Per-season fetchers ──────────────────────────────────────────────────────

export function fetchUsers(leagueId: string): Promise<SleeperUser[]> {
  return sleepFetch(`${SLEEPER_API}/league/${leagueId}/users`)
}

export function fetchRosters(leagueId: string): Promise<SleeperRoster[]> {
  return sleepFetch(`${SLEEPER_API}/league/${leagueId}/rosters`)
}

export function fetchMatchupsForWeek(leagueId: string, week: number): Promise<SleeperMatchup[]> {
  return sleepFetch(`${SLEEPER_API}/league/${leagueId}/matchups/${week}`)
}

export function fetchWinnersBracket(leagueId: string): Promise<BracketGame[]> {
  return sleepFetch(`${SLEEPER_API}/league/${leagueId}/winners_bracket`)
}

export function fetchLosersBracket(leagueId: string): Promise<BracketGame[]> {
  return sleepFetch(`${SLEEPER_API}/league/${leagueId}/losers_bracket`)
}
