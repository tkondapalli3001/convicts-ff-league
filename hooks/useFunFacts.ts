import { useMemo } from 'react'
import { useLeague } from '@/context/LeagueContext'
import { useRecordsData } from '@/hooks/useRecordsData'
import { computeLuckIndex } from '@/lib/luck'

interface HeartbreakEntry {
  owner: string
  pts: number
  oppPts: number
  year: number
  week: number
  opp: string
}

interface PerfectStormEntry {
  playerName: string
  pts: number
  owner: string
  year: number
  week: number
}

interface BoomBustEntry {
  owner: string
  stdDev: number
  avg: number
}

interface TheOwnerEntry {
  dominant: string
  victim: string
  wins: number
  losses: number
  winPct: number
}

interface LowestWinEntry {
  owner: string
  pts: number
  oppPts: number
  year: number
  week: number
  opp: string
}

interface LuckDuoEntry {
  luckiest: { owner: string; luckIndex: number }
  unluckiest: { owner: string; luckIndex: number }
}

export interface FunFactsData {
  heartbreak: HeartbreakEntry[]
  perfectStorm: PerfectStormEntry[]
  boomBust: BoomBustEntry[]
  theOwner: TheOwnerEntry[]
  lowestWins: LowestWinEntry[]
  luckDuo: LuckDuoEntry | null
}

export function useFunFacts(): FunFactsData {
  const { state } = useLeague()
  const { allScores, filteredMatchups } = useRecordsData()

  return useMemo(() => {
    // ── Card 1: Heartbreak Hotel ──────────────────────────────────────────────
    const heartbreak: HeartbreakEntry[] = allScores
      .filter(s => s.result === 'L' && s.pts > 0)
      .sort((a, b) => b.pts - a.pts)
      .slice(0, 5)
      .map(s => ({ owner: s.owner, pts: s.pts, oppPts: s.oppPts, year: s.year, week: s.week, opp: s.opp }))

    // ── Card 2: The Perfect Storm ─────────────────────────────────────────────
    // Build player_id → name from all draft data across seasons
    const playerNameMap: Record<string, string> = {}
    for (const yearStr of Object.keys(state.draftData)) {
      const yearDraft = state.draftData[Number(yearStr)]
      if (!yearDraft) continue
      for (const pick of yearDraft.picks) {
        if (!playerNameMap[pick.player_id]) {
          const { first_name, last_name } = pick.metadata
          const name = [first_name, last_name].filter(Boolean).join(' ')
          if (name) playerNameMap[pick.player_id] = name
        }
      }
    }

    const playerScores: PerfectStormEntry[] = []
    for (const [yearStr, weekMap] of Object.entries(state.matchups)) {
      const year = Number(yearStr)
      const rMap = state.rosterUserMaps[year] ?? {}
      for (const [weekStr, { matchups }] of Object.entries(weekMap)) {
        const week = Number(weekStr)
        for (const entry of matchups) {
          const owner = rMap[String(entry.roster_id)] ?? `Team ${entry.roster_id}`
          const starters = entry.starters ?? []
          const starterPts = entry.starters_points ?? []
          starters.forEach((pid, i) => {
            if (!pid || pid === '0') return
            const pts = starterPts[i] ?? 0
            if (pts <= 0) return
            playerScores.push({
              playerName: playerNameMap[pid] ?? `Player #${pid}`,
              pts,
              owner,
              year,
              week,
            })
          })
        }
      }
    }
    const perfectStorm = playerScores.sort((a, b) => b.pts - a.pts).slice(0, 5)

    // ── Card 3: The Boom-Bust Specialist ─────────────────────────────────────
    const scoresByOwner: Record<string, number[]> = {}
    for (const m of filteredMatchups) {
      if (m.type !== 'R') continue
      for (const [owner, pts] of [[m.team1, m.pts1], [m.team2, m.pts2]] as [string, number][]) {
        if (pts <= 0) continue
        if (!scoresByOwner[owner]) scoresByOwner[owner] = []
        scoresByOwner[owner].push(pts)
      }
    }
    const boomBust: BoomBustEntry[] = Object.entries(scoresByOwner)
      .filter(([, scores]) => scores.length >= 4)
      .map(([owner, scores]) => {
        const n = scores.length
        const avg = scores.reduce((s, x) => s + x, 0) / n
        const stdDev = Math.sqrt(scores.reduce((s, x) => s + (x - avg) ** 2, 0) / n)
        return { owner, stdDev, avg }
      })
      .sort((a, b) => b.stdDev - a.stdDev)
      .slice(0, 3)

    // ── Card 4: The Owner ─────────────────────────────────────────────────────
    const INACTIVE = new Set(['Hamza', 'Sangram'])
    const pairGames: Record<string, number> = {}
    const dirWins: Record<string, number> = {}

    for (const m of filteredMatchups.filter(m => !INACTIVE.has(m.team1) && !INACTIVE.has(m.team2))) {
      const sortedKey = [m.team1, m.team2].sort().join('|||')
      pairGames[sortedKey] = (pairGames[sortedKey] ?? 0) + 1
      const winKey = `${m.winner}|||${m.loser}`
      dirWins[winKey] = (dirWins[winKey] ?? 0) + 1
    }

    const theOwner: TheOwnerEntry[] = []
    for (const [sortedKey, totalGames] of Object.entries(pairGames)) {
      if (totalGames < 4) continue
      const [nameA, nameB] = sortedKey.split('|||')
      const winsA = dirWins[`${nameA}|||${nameB}`] ?? 0
      const winsB = dirWins[`${nameB}|||${nameA}`] ?? 0
      const [dominant, victim, wins, losses] =
        winsA >= winsB ? [nameA, nameB, winsA, winsB] : [nameB, nameA, winsB, winsA]
      if (wins / totalGames >= 0.75) {
        theOwner.push({ dominant, victim, wins, losses, winPct: wins / totalGames })
      }
    }
    theOwner.sort((a, b) => b.winPct - a.winPct || b.wins - a.wins)

    // ── Card 5: Dumpster Divers ───────────────────────────────────────────────
    const lowestWins: LowestWinEntry[] = allScores
      .filter(s => s.result === 'W' && s.pts > 0)
      .sort((a, b) => a.pts - b.pts)
      .slice(0, 5)
      .map(s => ({ owner: s.owner, pts: s.pts, oppPts: s.oppPts, year: s.year, week: s.week, opp: s.opp }))

    // ── Card 6: Lucky Charm / Cosmic Punching Bag ────────────────────────────
    const luckEntries = computeLuckIndex(state.matchups, state.rosterUserMaps, state.ownerSeasons)
    let luckDuo: LuckDuoEntry | null = null
    if (luckEntries.length >= 2) {
      const luckiest = luckEntries[0]
      const unluckiest = luckEntries[luckEntries.length - 1]
      luckDuo = {
        luckiest: { owner: luckiest.owner, luckIndex: luckiest.luckIndex },
        unluckiest: { owner: unluckiest.owner, luckIndex: unluckiest.luckIndex },
      }
    }

    return { heartbreak, perfectStorm, boomBust, theOwner, lowestWins, luckDuo }
  }, [state, allScores, filteredMatchups])
}
