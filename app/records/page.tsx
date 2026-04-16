'use client'

import { useMemo } from 'react'
import { useLeague } from '@/context/LeagueContext'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ErrorState from '@/components/shared/ErrorState'
import RecordItem from '@/components/shared/RecordItem'
import ScoreLeaderboard from '@/components/records/ScoreLeaderboard'
import StreakList from '@/components/records/StreakList'

export default function RecordsPage() {
  const { state } = useLeague()
  const { loaded, error, allMatchups, ownerSeasons, rosters, users, rosterUserMaps, years } = state

  if (error) return <ErrorState error={error} />
  if (!loaded) return <LoadingSpinner />

  const allScores = allMatchups.flatMap(g => [
    { owner: g.team1, pts: g.pts1, year: g.year, week: g.week, opp: g.team2, oppPts: g.pts2, result: (g.pts1 >= g.pts2 ? 'W' : 'L') as 'W' | 'L' },
    { owner: g.team2, pts: g.pts2, year: g.year, week: g.week, opp: g.team1, oppPts: g.pts1, result: (g.pts2 > g.pts1 ? 'W' : 'L') as 'W' | 'L' },
  ])

  const validScores = allScores.filter(s => s.pts > 0)
  const highScore   = validScores.reduce((m, s) => s.pts > m.pts ? s : m, validScores[0])
  const lowScore    = validScores.reduce((m, s) => s.pts < m.pts ? s : m, validScores[0])
  const maxMargin   = allMatchups.reduce((m, g) => g.margin > m.margin ? g : m, allMatchups[0])
  const minMargin   = allMatchups.reduce((m, g) => g.margin < m.margin ? g : m, allMatchups[0])

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
  const playoffGames = allMatchups.filter(g => g.type === 'P')
  const biggestPlayoffBlowout = playoffGames.length ? playoffGames.reduce((m, g) => g.margin > m.margin ? g : m, playoffGames[0]) : null

  // 140+ and sub-80 games
  const high140 = validScores.filter(s => s.pts >= 140).sort((a, b) => b.pts - a.pts)
  const low80   = validScores.filter(s => s.pts <= 80).sort((a, b) => a.pts - b.pts)

  const countByOwner = (scores: typeof validScores) => {
    const map: Record<string, number> = {}
    scores.forEach(s => { map[s.owner] = (map[s.owner] || 0) + 1 })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }

  // H2H rivalry
  const h2hCount: Record<string, number> = {}
  allMatchups.forEach(g => {
    const key = [g.team1, g.team2].sort().join('|||')
    h2hCount[key] = (h2hCount[key] || 0) + 1
  })
  const topRivalry = Object.entries(h2hCount).sort((a, b) => b[1] - a[1])[0]
  const [rv1, rv2] = topRivalry?.[0]?.split('|||') || ['—', '—']

  // Win/Loss streaks
  const ownerGameList: Record<string, { won: boolean; year: number; week: number }[]> = {}
  allMatchups.forEach(g => {
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

  // Luck (potential points)
  const pptsData: Record<string, { ppts: number; fpts: number; luck: number }> = {}
  Object.keys(ownerSeasons).forEach(name => {
    let totalPPts = 0, totalFPts = 0, count = 0
    Object.keys(rosters).map(Number).forEach(year => {
      const yearUsers = users[year] || []
      const umap: Record<string, string> = {}
      yearUsers.forEach(u => { umap[u.user_id] = u.display_name })
      ;(rosters[year] || []).forEach(r => {
        if (!r.owner_id || !umap[r.owner_id]) return
        const rMap = rosterUserMaps[year] || {}
        if (rMap[String(r.roster_id)] !== name) return
        const ppts = (r.settings?.ppts || 0) + (r.settings?.ppts_decimal || 0) / 100
        const fpts = (r.settings?.fpts  || 0) + (r.settings?.fpts_decimal  || 0) / 100
        if (ppts > 0) { totalPPts += ppts; totalFPts += fpts; count++ }
      })
    })
    if (count > 0) pptsData[name] = { ppts: totalPPts / count, fpts: totalFPts / count, luck: (totalFPts - totalPPts) / count }
  })
  const luckiest   = Object.entries(pptsData).sort((a, b) => b[1].luck - a[1].luck)[0]
  const unluckiest = Object.entries(pptsData).sort((a, b) => a[1].luck - b[1].luck)[0]

  return (
    <div className="animate-fade-in">
      <h1 className="text-[26px] font-extrabold text-s-text mb-1">League Records</h1>
      <p className="text-[13px] text-s-text3 mb-6">All-time milestones, extremes & fun stats across {years.length} seasons</p>

      {/* Scoring + Matchup extremes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-[14px] mb-4">
        <div>
          <div className="text-[10px] font-bold tracking-[3px] uppercase text-s-text3 mb-2">Scoring Extremes</div>
          <RecordItem icon="🔥" label="Highest Single Game"     value={highScore?.pts.toFixed(2) || '—'}   context={`${highScore?.owner} · ${highScore?.year} Wk${highScore?.week} vs ${highScore?.opp}`} />
          <RecordItem icon="🥶" label="Lowest Single Game"      value={lowScore?.pts.toFixed(2)  || '—'}   context={`${lowScore?.owner} · ${lowScore?.year} Wk${lowScore?.week} vs ${lowScore?.opp}`} />
          <RecordItem icon="📈" label="Highest Season PF"       value={highPF?.pf.toFixed(1)     || '—'}   context={`${highPF?.name} · ${highPF?.year} · ${highPF ? (highPF.pf/14).toFixed(1) : '—'} pts/wk avg`} />
          <RecordItem icon="📉" label="Lowest Season PF"        value={lowPF?.pf.toFixed(1)      || '—'}   context={`${lowPF?.name} · ${lowPF?.year}`} />
        </div>
        <div>
          <div className="text-[10px] font-bold tracking-[3px] uppercase text-s-text3 mb-2">Matchup Records</div>
          <RecordItem icon="💥" label="Largest Margin of Victory" value={`${maxMargin?.margin.toFixed(2)} pts`} context={`${maxMargin?.winner} def. ${maxMargin?.loser} · ${maxMargin?.year} Wk${maxMargin?.week}`} />
          <RecordItem icon="⚖️" label="Narrowest Victory"         value={`${minMargin?.margin.toFixed(2)} pts`} context={`${minMargin?.winner} def. ${minMargin?.loser} · ${minMargin?.year} Wk${minMargin?.week}`} />
          {biggestPlayoffBlowout && (
            <RecordItem icon="🎯" label="Biggest Playoff Blowout" value={`${biggestPlayoffBlowout.margin.toFixed(2)} pts`} context={`${biggestPlayoffBlowout.winner} def. ${biggestPlayoffBlowout.loser} · ${biggestPlayoffBlowout.year} Wk${biggestPlayoffBlowout.week}`} />
          )}
          <RecordItem icon="🔄" label="Most Played Rivalry"       value={`${topRivalry?.[1] || 0} games`}   context={`${rv1} vs ${rv2}`} />
        </div>
      </div>

      {/* Season + Career records */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-[14px] mb-4">
        <div>
          <div className="text-[10px] font-bold tracking-[3px] uppercase text-s-text3 mb-2">Season Records</div>
          {bestWinPct  && <RecordItem icon="🏆" label="Best Single-Season Win%"   value={`${(bestWinPct.wins /(bestWinPct.wins +bestWinPct.losses )*100).toFixed(1)}%`} context={`${bestWinPct.name} · ${bestWinPct.year} (${bestWinPct.wins}-${bestWinPct.losses})`} />}
          {worstWinPct && <RecordItem icon="💀" label="Worst Single-Season Win%"  value={`${(worstWinPct.wins/(worstWinPct.wins+worstWinPct.losses)*100).toFixed(1)}%`} context={`${worstWinPct.name} · ${worstWinPct.year} (${worstWinPct.wins}-${worstWinPct.losses})`} />}
          <RecordItem icon="📊" label="Best Season PF Margin"    value={`+${(bestMarginSeason.pf -bestMarginSeason.pa).toFixed(1)}`}  context={`${bestMarginSeason.name} · ${bestMarginSeason.year}`} />
          <RecordItem icon="🩸" label="Worst Season PF Margin"   value={`${(worstMarginSeason.pf-worstMarginSeason.pa).toFixed(1)}`} context={`${worstMarginSeason.name} · ${worstMarginSeason.year}`} />
        </div>
        <div>
          <div className="text-[10px] font-bold tracking-[3px] uppercase text-s-text3 mb-2">Career Milestones</div>
          <RecordItem icon="💰" label="All-Time Most Money Won"   value="+$450"  context="Kerry — won 2025 for +$675 in biggest single-year payout" />
          <RecordItem icon="🩸" label="All-Time Most Money Lost"  value="-$410"  context="Teja — 7 seasons, 0 rings, 2x toilet bowl 💔" />
          <RecordItem icon="👑" label="Most Championships"        value="2x — Daniyaal" context="2020 & 2023 · Armaan & Dustin share 0.5x (2022 co-champs)" />
          <RecordItem icon="🚽" label="Most Toilet Bowls"         value="2x — Teja & Nathan" context="Teja: 2021 & 2024 · Nathan: 2020 & 2022" />
        </div>
      </div>

      {/* 140+ explosions */}
      <div className="text-[10px] font-bold tracking-[3px] uppercase text-s-text3 mb-2">
        🔥 140+ Point Explosions ({high140.length} total)
      </div>
      <ScoreLeaderboard title="140+" scores={high140} variant="high" countByOwner={countByOwner(high140)} />

      {/* Sub-80 stinkers */}
      <div className="text-[10px] font-bold tracking-[3px] uppercase text-s-text3 mb-2">
        🥶 Sub-80 Stinkers ({low80.length} total)
      </div>
      <ScoreLeaderboard title="Sub-80" scores={low80} variant="low" countByOwner={countByOwner(low80)} />

      {/* Win/Loss streaks */}
      <div className="text-[10px] font-bold tracking-[3px] uppercase text-s-text3 mb-2">🔥❄️ Win & Loss Streaks</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-[14px] mb-4">
        <StreakList title="Longest Win Streaks"   streaks={topWinStreaks}  variant="win" />
        <StreakList title="Longest Losing Streaks" streaks={topLossStreaks} variant="loss" />
      </div>

      {/* Luck */}
      {(luckiest || unluckiest) && (
        <>
          <div className="text-[10px] font-bold tracking-[3px] uppercase text-s-text3 mb-2">🎲 Luck & Potential Points</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[14px]">
            {luckiest && (
              <RecordItem
                icon="🍀"
                label="Luckiest Owner (Actual vs Potential)"
                value={luckiest[0]}
                context={`Avg PF ${luckiest[1].fpts.toFixed(0)} vs potential ${luckiest[1].ppts.toFixed(0)} — scored above max`}
              />
            )}
            {unluckiest && (
              <RecordItem
                icon="😤"
                label="Most Unlucky (Left pts on bench)"
                value={unluckiest[0]}
                context={`Avg ${Math.abs(unluckiest[1].luck).toFixed(0)} pts/season left on bench`}
              />
            )}
          </div>
        </>
      )}
    </div>
  )
}
