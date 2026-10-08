import { SLEEPER_API } from '@/lib/league'
import type { SleeperLeague, SleeperUser, SleeperRoster, SleeperMatchup, BracketGame, SleeperDraft, DraftPick, Transaction } from '@/types'

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

// ─── Per-season fetchers ──────────────────────────────────────────────────────
// (The league-chain walk lives in LeagueContext — it is snapshot-aware and
// only fetches seasons missing from public/data/.)

export function fetchLeague(leagueId: string): Promise<SleeperLeague> {
  return sleepFetch(`${SLEEPER_API}/league/${leagueId}`)
}

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

// ─── Draft fetchers ───────────────────────────────────────────────────────────

export function fetchDrafts(leagueId: string): Promise<SleeperDraft[]> {
  return sleepFetch(`${SLEEPER_API}/league/${leagueId}/drafts`)
}

export function fetchDraftPicks(draftId: string): Promise<DraftPick[]> {
  return sleepFetch(`${SLEEPER_API}/draft/${draftId}/picks`)
}

// ─── Transaction fetchers ─────────────────────────────────────────────────────

export function fetchTransactions(leagueId: string, week: number): Promise<Transaction[]> {
  return sleepFetch(`${SLEEPER_API}/league/${leagueId}/transactions/${week}`)
}

/** Several weeks' moves at once (week → moves). A week Sleeper doesn't answer comes back empty and listed in `failed`. */
export async function fetchTransactionWeeks(
  leagueId: string,
  weeks: number[],
): Promise<{ byWeek: Record<number, Transaction[]>; failed: number[] }> {
  const rows = await Promise.all(weeks.map(w =>
    fetchTransactions(leagueId, w).then(txs => [w, txs, false] as const).catch(() => [w, [] as Transaction[], true] as const)
  ))
  return {
    byWeek: Object.fromEntries(rows.map(([w, txs]) => [w, txs])),
    failed: rows.filter(([, , failed]) => failed).map(([w]) => w),
  }
}
