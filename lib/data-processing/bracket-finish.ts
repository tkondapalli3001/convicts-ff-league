import type { BracketGame } from '@/types'

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
