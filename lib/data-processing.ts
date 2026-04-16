import { USER_ID_TO_OWNER, DISPLAY_NAME_TO_OWNER, MANUAL_CHAMPS, MANUAL_SHAME, MANUAL_PLAYOFF_OVERRIDES } from '@/lib/constants'
import type { LeagueState, Matchup, OwnerSeason, BracketGame } from '@/types'

// ─── Owner name resolution ────────────────────────────────────────────────────

export function resolveOwnerName(userId: string | undefined, displayName: string | undefined): string {
  if (userId && USER_ID_TO_OWNER[userId]) return USER_ID_TO_OWNER[userId]
  if (displayName && DISPLAY_NAME_TO_OWNER[displayName]) return DISPLAY_NAME_TO_OWNER[displayName]
  return displayName || 'Unknown'
}

// ─── Bracket → finish position ────────────────────────────────────────────────

export function getFinishFromBracket(
  bracket: { winners: BracketGame[]; losers: BracketGame[] },
  rosterId: number,
  totalTeams: number
): number | null {
  const { winners, losers } = bracket

  if (winners?.length) {
    // Championship game
    const champGame = winners.find(g => g.p === 1)
    if (champGame) {
      if (champGame.w === rosterId) return 1
      if (champGame.l === rosterId) return 2
    }
    // 3rd place
    const thirdGame = winners.find(g => g.p === 3)
    if (thirdGame) {
      if (thirdGame.w === rosterId) return 3
      if (thirdGame.l === rosterId) return 4
    }
    // 5th place
    const fifthGame = winners.find(g => g.p === 5)
    if (fifthGame) {
      if (fifthGame.w === rosterId) return 5
      if (fifthGame.l === rosterId) return 6
    }
    // Any other winners bracket participant → playoff team
    const allWinnerIds = new Set<number>()
    winners.forEach(g => {
      if (g.t1) allWinnerIds.add(g.t1)
      if (g.t2) allWinnerIds.add(g.t2)
    })
    if (allWinnerIds.has(rosterId)) return 5
  }

  if (losers?.length) {
    const maxRound = Math.max(...losers.map(g => g.r))
    // Toilet bowl (last place)
    const toiletGame = losers.find(g => g.r === maxRound && g.p === 1)
    if (toiletGame) {
      if (toiletGame.l === rosterId) return totalTeams
      if (toiletGame.w === rosterId) return totalTeams - 1
    }
    // Third-from-bottom
    const thirdFromBottom = losers.find(g => g.r === maxRound && g.p === 3)
    if (thirdFromBottom) {
      if (thirdFromBottom.l === rosterId) return totalTeams - 2
      if (thirdFromBottom.w === rosterId) return totalTeams - 3
    }
    // Any losers bracket participant
    const allLoserIds = new Set<number>()
    losers.forEach(g => {
      if (g.t1) allLoserIds.add(g.t1)
      if (g.t2) allLoserIds.add(g.t2)
    })
    if (allLoserIds.has(rosterId)) return Math.ceil(totalTeams * 0.7)
  }

  return null
}

// ─── Build flat matchup list ──────────────────────────────────────────────────

export function buildFlatMatchups(state: LeagueState): Matchup[] {
  const allMatchups: Matchup[] = []

  const loadedYears = Object.keys(state.matchups)
    .map(Number)
    .sort((a, b) => a - b)

  for (const year of loadedYears) {
    if (!state.matchups[year]) continue
    const rMap = state.rosterUserMaps[year] || {}

    for (const [weekStr, { matchups, isPlayoff }] of Object.entries(state.matchups[year])) {
      const week = parseInt(weekStr)
      // Group by matchup_id
      const groups: Record<number, typeof matchups> = {}
      matchups.forEach(m => {
        if (!groups[m.matchup_id]) groups[m.matchup_id] = []
        groups[m.matchup_id].push(m)
      })

      for (const group of Object.values(groups)) {
        if (group.length !== 2) continue
        const [a, b] = group
        const nameA = rMap[String(a.roster_id)] || `Team${a.roster_id}`
        const nameB = rMap[String(b.roster_id)] || `Team${b.roster_id}`
        const ptsA = a.points || 0
        const ptsB = b.points || 0
        allMatchups.push({
          year,
          week,
          team1: nameA, pts1: ptsA, roster1: a.roster_id,
          team2: nameB, pts2: ptsB, roster2: b.roster_id,
          type: isPlayoff ? 'P' : 'R',
          winner: ptsA >= ptsB ? nameA : nameB,
          loser:  ptsA >= ptsB ? nameB : nameA,
          margin: Math.abs(ptsA - ptsB),
        })
      }
    }
  }

  allMatchups.sort((a, b) => a.year - b.year || a.week - b.week)
  return allMatchups
}

// ─── Build per-owner season stats ─────────────────────────────────────────────

export function buildOwnerSeasons(state: LeagueState): Record<string, OwnerSeason[]> {
  // Collect all canonical names seen across all years
  const allNames = new Set<string>()
  const loadedYears = Object.keys(state.rosterUserMaps).map(Number).sort((a, b) => a - b)
  for (const year of loadedYears) {
    Object.values(state.rosterUserMaps[year] || {}).forEach(n => allNames.add(n))
  }

  const ownerSeasons: Record<string, OwnerSeason[]> = {}

  allNames.forEach(name => {
    const seasons: OwnerSeason[] = []

    for (const year of loadedYears) {
      const rMap = state.rosterUserMaps[year] || {}
      // Find roster_id for this owner in this year
      const entry = Object.entries(rMap).find(([, v]) => v === name)
      if (!entry) continue
      const roster_id = parseInt(entry[0])

      // Compute H2H wins/losses/PF/PA from matchup data (correctly excludes 2024 median games,
      // since those produce groups of size ≠ 2 and are filtered out by the group.length !== 2 check)
      let wins = 0, losses = 0, ties = 0, pf = 0, pa = 0
      for (const [, { matchups: weekMatchups, isPlayoff }] of Object.entries(state.matchups[year] || {})) {
        if (isPlayoff) continue
        const groups: Record<number, typeof weekMatchups> = {}
        weekMatchups.forEach(m => {
          if (!groups[m.matchup_id]) groups[m.matchup_id] = []
          groups[m.matchup_id].push(m)
        })
        for (const group of Object.values(groups)) {
          if (group.length !== 2) continue
          const mine = group.find(m => m.roster_id === roster_id)
          if (!mine) continue
          const opp = group.find(m => m.roster_id !== roster_id)!
          if (!opp) continue
          const myPts = mine.points || 0
          const oppPts = opp.points || 0
          pf += myPts
          pa += oppPts
          if (myPts > oppPts) wins++
          else if (myPts < oppPts) losses++
          else ties++
        }
      }

      const bracket = state.brackets[year]
      const lgSettings = state.leagues[year]?.settings || {}
      const totalRosters = lgSettings.num_teams || 10
      const playoffStart = lgSettings.playoff_week_start || 15

      let finish: number | null = null
      if (bracket) {
        finish = getFinishFromBracket(bracket, roster_id, totalRosters)
      }

      // Mark as playoff team if roster_id appears in winners bracket seedings
      const winnerIds = new Set<number>()
      ;(bracket?.winners || []).forEach(g => {
        if (g.t1) winnerIds.add(g.t1)
        if (g.t2) winnerIds.add(g.t2)
      })
      let inPlayoffs = winnerIds.has(roster_id)

      // ── Manual overrides: correct bracket data inconsistencies ──────────────
      const manualShame   = MANUAL_SHAME.find(s => s.year === year && s.loser === name)
      const manualChamp   = MANUAL_CHAMPS.find(c => c.year === year && c.winner?.includes(name))
      const manualPlayoff = MANUAL_PLAYOFF_OVERRIDES.find(p => p.year === year && p.owner === name)

      if (manualShame) {
        // Confirmed toilet-bowl loser for this year
        finish    = totalRosters
        inPlayoffs = false
      } else if (manualChamp) {
        // Confirmed champion for this year
        finish    = 1
        inPlayoffs = true
      } else if (manualPlayoff) {
        // Confirmed playoff participant whose bracket data may be wrong
        inPlayoffs = true
        if (finish != null && finish >= totalRosters - 1) {
          finish = manualPlayoff.finish ?? 5
        }
      } else {
        // Generic safeguard: if another owner is the confirmed shame loser for this year
        // but this owner incorrectly received last place from the bracket, clear the finish
        const yearShame = MANUAL_SHAME.find(s => s.year === year)
        if (yearShame && finish === totalRosters) {
          finish = null
        }
      }

      seasons.push({ year, wins, losses, ties, pf, pa, finish, inPlayoffs, roster_id, playoffStart, totalRosters })
    }

    if (seasons.length > 0) ownerSeasons[name] = seasons
  })

  return ownerSeasons
}
