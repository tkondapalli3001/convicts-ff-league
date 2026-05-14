import { useLeague } from '@/context/LeagueContext'
import { EXCLUDED_GAME_SCORES } from '@/lib/constants'

export function useRecordsData() {
  const { state } = useLeague()
  const { allMatchups, ownerSeasons, brackets, rosterUserMaps, leagues } = state

  const consolationGameKeys = new Set<string>()
  for (const [yearStr, bracket] of Object.entries(brackets)) {
    const year = Number(yearStr)
    const rMap = rosterUserMaps[year] ?? {}
    const playoffStart = leagues[year]?.settings?.playoff_week_start ?? 15

    const addConsolationGame = (r: number, idA: number, idB: number) => {
      const week = playoffStart + (r - 1)
      const nameA = rMap[String(idA)] ?? `Team${idA}`
      const nameB = rMap[String(idB)] ?? `Team${idB}`
      consolationGameKeys.add(`${year}|||${week}|||${nameA}|||${nameB}`)
      consolationGameKeys.add(`${year}|||${week}|||${nameB}|||${nameA}`)
    }

    // Winners bracket non-championship games (3rd, 5th, 7th place, etc.)
    ;(bracket.winners ?? [])
      .filter(g => g.p && g.p !== 1)
      .forEach(g => {
        if (g.t1 != null && g.t2 != null) addConsolationGame(g.r, g.t1, g.t2)
        else if (g.w != null && g.l != null) addConsolationGame(g.r, g.w, g.l)
      })

    // All losers bracket games (toilet bowl path)
    ;(bracket.losers ?? []).forEach(g => {
      if (g.t1 != null && g.t2 != null) addConsolationGame(g.r, g.t1, g.t2)
      else if (g.w != null && g.l != null) addConsolationGame(g.r, g.w, g.l)
    })
  }

  const filteredMatchups = allMatchups.filter(g =>
    !EXCLUDED_GAME_SCORES.some(e => e.year === g.year && e.week === g.week &&
      (e.owner === g.team1 || e.owner === g.team2))
  )

  const allScores = filteredMatchups.flatMap(g => [
    { owner: g.team1, pts: g.pts1, year: g.year, week: g.week, opp: g.team2, oppPts: g.pts2, result: (g.pts1 >= g.pts2 ? 'W' : 'L') as 'W' | 'L' },
    { owner: g.team2, pts: g.pts2, year: g.year, week: g.week, opp: g.team1, oppPts: g.pts1, result: (g.pts2 > g.pts1 ? 'W' : 'L') as 'W' | 'L' },
  ])

  const validScores = allScores.filter(s => s.pts > 0)
  const highScore   = validScores.reduce((m, s) => s.pts > m.pts ? s : m, validScores[0])
  const lowScore    = validScores.reduce((m, s) => s.pts < m.pts ? s : m, validScores[0])
  const maxMargin   = filteredMatchups.reduce((m, g) => g.margin > m.margin ? g : m, filteredMatchups[0])
  const minMargin   = filteredMatchups.reduce((m, g) => g.margin < m.margin ? g : m, filteredMatchups[0])

  const allSeasonStats = Object.entries(ownerSeasons).flatMap(([name, seasons]) =>
    seasons.map(s => ({ ...s, name }))
  )
  const withRecord = allSeasonStats.filter(s => s.wins + s.losses > 10)
  const bestWinPct  = withRecord.reduce((m, s) => (s.wins / (s.wins + s.losses)) > (m.wins / (m.wins + m.losses)) ? s : m, withRecord[0] || allSeasonStats[0])
  const worstWinPct = withRecord.reduce((m, s) => (s.wins / (s.wins + s.losses)) < (m.wins / (m.wins + m.losses)) ? s : m, withRecord[0] || allSeasonStats[0])
  const highPF = allSeasonStats.reduce((m, s) => s.pf > m.pf ? s : m, allSeasonStats[0])
  const lowPF  = allSeasonStats.reduce((m, s) => s.pf < m.pf ? s : m, allSeasonStats[0])
  const bestMarginSeason  = allSeasonStats.reduce((m, s) => (s.pf - s.pa) > (m.pf - m.pa) ? s : m, allSeasonStats[0])
  const worstMarginSeason = allSeasonStats.reduce((m, s) => (s.pf - s.pa) < (m.pf - m.pa) ? s : m, allSeasonStats[0])
  const playoffGames = filteredMatchups.filter(g => g.type === 'P')
  const biggestPlayoffBlowout = playoffGames.length ? playoffGames.reduce((m, g) => g.margin > m.margin ? g : m, playoffGames[0]) : null

  const high140 = validScores.filter(s => s.pts >= 140).sort((a, b) => b.pts - a.pts)
  const low80   = validScores.filter(s => s.pts <= 80 && !consolationGameKeys.has(`${s.year}|||${s.week}|||${s.owner}|||${s.opp}`)).sort((a, b) => a.pts - b.pts)

  const countByOwner = (scores: typeof validScores) => {
    const map: Record<string, number> = {}
    scores.forEach(s => { map[s.owner] = (map[s.owner] || 0) + 1 })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }

  const h2hCount: Record<string, number> = {}
  filteredMatchups.forEach(g => {
    const key = [g.team1, g.team2].sort().join('|||')
    h2hCount[key] = (h2hCount[key] || 0) + 1
  })
  const topRivalry = Object.entries(h2hCount).sort((a, b) => b[1] - a[1])[0]
  const [rv1, rv2] = topRivalry?.[0]?.split('|||') || ['—', '—']

  const ownerGameList: Record<string, { won: boolean; year: number; week: number }[]> = {}
  filteredMatchups.forEach(g => {
    [g.team1, g.team2].forEach((o, i) => {
      if (!ownerGameList[o]) ownerGameList[o] = []
      const myPts  = i === 0 ? g.pts1 : g.pts2
      const oppPts = i === 0 ? g.pts2 : g.pts1
      ownerGameList[o].push({ won: myPts >= oppPts, year: g.year, week: g.week })
    })
  })

  const streaks: Record<string, { maxWin: number; winStart: { year: number; week: number }; winEnd: { year: number; week: number }; maxLoss: number; lossStart: { year: number; week: number }; lossEnd: { year: number; week: number } }> = {}
  Object.entries(ownerGameList).forEach(([owner, games]) => {
    games.sort((a, b) => a.year - b.year || a.week - b.week)
    let mxW = 0, mxL = 0, cW = 0, cL = 0
    let bWS = games[0], bWE = games[0], bLS = games[0], bLE = games[0]
    let tmpWS = games[0], tmpLS = games[0]
    games.forEach(g => {
      if (g.won) {
        if (cW === 0) tmpWS = g
        cW++; cL = 0
        if (cW > mxW) { mxW = cW; bWS = tmpWS; bWE = g }
      } else {
        if (cL === 0) tmpLS = g
        cL++; cW = 0
        if (cL > mxL) { mxL = cL; bLS = tmpLS; bLE = g }
      }
    })
    streaks[owner] = { maxWin: mxW, winStart: bWS, winEnd: bWE, maxLoss: mxL, lossStart: bLS, lossEnd: bLE }
  })

  const topWinStreaks = Object.entries(streaks)
    .sort((a, b) => b[1].maxWin - a[1].maxWin).slice(0, 6)
    .map(([owner, d]) => ({ owner, streak: d.maxWin, startYear: d.winStart.year, startWeek: d.winStart.week, endYear: d.winEnd.year, endWeek: d.winEnd.week }))

  const topLossStreaks = Object.entries(streaks)
    .sort((a, b) => b[1].maxLoss - a[1].maxLoss).slice(0, 6)
    .map(([owner, d]) => ({ owner, streak: d.maxLoss, startYear: d.lossStart.year, startWeek: d.lossStart.week, endYear: d.lossEnd.year, endWeek: d.lossEnd.week }))

  return {
    filteredMatchups, allScores, validScores,
    highScore, lowScore, maxMargin, minMargin,
    allSeasonStats, withRecord, bestWinPct, worstWinPct,
    highPF, lowPF, bestMarginSeason, worstMarginSeason,
    playoffGames, biggestPlayoffBlowout,
    high140, low80, countByOwner,
    h2hCount, topRivalry, rv1, rv2,
    ownerGameList, streaks, topWinStreaks, topLossStreaks,
  }
}
