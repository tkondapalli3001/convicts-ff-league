import { useMemo } from 'react'
import { useLeague } from '@/context/LeagueContext'
import { useRecordsData } from '@/hooks/useRecordsData'

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

interface PaperTigerEntry {
  owner: string
  winPct: number
  totalPF: number
  winPctRank: number
  pfRank: number
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

export interface FunFactsData {
  heartbreak: HeartbreakEntry[]
  perfectStorm: PerfectStormEntry[]
  paperTigers: PaperTigerEntry[]
  boomBust: BoomBustEntry[]
  theOwner: TheOwnerEntry[]
}

export function useFunFacts(): FunFactsData {
  const { state } = useLeague()
  const { allScores, filteredMatchups } = useRecordsData()

  return useMemo(() => {
    const last3Years = new Set(state.years.slice(-3))

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

    // ── Card 3: The Paper Tiger ───────────────────────────────────────────────
    type CareerStat = { owner: string; wins: number; losses: number; totalPF: number }
    const careerMap: Record<string, CareerStat> = {}
    for (const [owner, seasons] of Object.entries(state.ownerSeasons)) {
      const wins = seasons.reduce((s, x) => s + x.wins, 0)
      const losses = seasons.reduce((s, x) => s + x.losses, 0)
      const totalPF = seasons.reduce((s, x) => s + x.pf, 0)
      careerMap[owner] = { owner, wins, losses, totalPF }
    }
    const careerList = Object.values(careerMap).filter(c => c.wins + c.losses > 0)

    const byWinPct = [...careerList].sort(
      (a, b) => b.wins / (b.wins + b.losses) - a.wins / (a.wins + a.losses)
    )
    const byPF = [...careerList].sort((a, b) => a.totalPF - b.totalPF)

    const top3WinPct = new Set(byWinPct.slice(0, 3).map(c => c.owner))
    const bottom5PF = new Set(byPF.slice(0, 5).map(c => c.owner))

    const paperTigers: PaperTigerEntry[] = careerList
      .filter(c => top3WinPct.has(c.owner) && bottom5PF.has(c.owner))
      .map(c => ({
        owner: c.owner,
        winPct: c.wins / (c.wins + c.losses),
        totalPF: c.totalPF,
        winPctRank: byWinPct.findIndex(x => x.owner === c.owner) + 1,
        pfRank: byPF.findIndex(x => x.owner === c.owner) + 1,
      }))
      .sort((a, b) => a.winPctRank - b.winPctRank)

    // ── Card 4: The Boom-Bust Specialist ─────────────────────────────────────
    const scoresByOwner: Record<string, number[]> = {}
    for (const s of allScores) {
      if (!last3Years.has(s.year) || s.pts <= 0) continue
      if (!scoresByOwner[s.owner]) scoresByOwner[s.owner] = []
      scoresByOwner[s.owner].push(s.pts)
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

    // ── Card 5: The Owner ─────────────────────────────────────────────────────
    const recentMatchups = filteredMatchups.filter(m => last3Years.has(m.year))
    const pairGames: Record<string, number> = {}
    const dirWins: Record<string, number> = {}

    for (const m of recentMatchups) {
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

    return { heartbreak, perfectStorm, paperTigers, boomBust, theOwner }
  }, [state, allScores, filteredMatchups])
}
