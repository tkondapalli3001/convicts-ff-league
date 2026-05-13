'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useLeague } from '@/context/LeagueContext'
import { fmtPts } from '@/lib/utils'
import { MANUAL_CHAMPS, MANUAL_SHAME, EARNINGS_DATA } from '@/lib/constants'
import OwnerAvatar from '@/components/shared/OwnerAvatar'
import StatBox from '@/components/shared/StatBox'
import FinishBadge from '@/components/shared/FinishBadge'
import WinPctBadge from '@/components/shared/WinPctBadge'
import H2HGrid from './H2HGrid'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ErrorState from '@/components/shared/ErrorState'

type Tab = 'seasons' | 'h2h' | 'gamelog'

export default function OwnerDetail({ ownerName }: { ownerName: string }) {
  const { state } = useLeague()
  const { loaded, error, ownerSeasons, allMatchups, brackets, rosterUserMaps, leagues, draftData } = state
  const [tab, setTab] = useState<Tab>('seasons')

  // Must be before early returns (React hook rules)
  const ownerGames = useMemo(
    () => allMatchups.filter(g => g.team1 === ownerName || g.team2 === ownerName),
    [allMatchups, ownerName]
  )

  const consolationGameKeys = useMemo(() => {
    const set = new Set<string>()
    for (const [yearStr, bracket] of Object.entries(brackets)) {
      const year = Number(yearStr)
      const rMap = rosterUserMaps[year] ?? {}
      const playoffStart = leagues[year]?.settings?.playoff_week_start ?? 15
      ;(bracket.winners ?? [])
        .filter(g => g.p && g.p !== 1)
        .forEach(g => {
          const t1Id = g.t1 ?? null
          const t2Id = g.t2 ?? null
          if (t1Id != null && t2Id != null) {
            const week = playoffStart + (g.r - 1)
            const t1Name = rMap[String(t1Id)] ?? `Team${t1Id}`
            const t2Name = rMap[String(t2Id)] ?? `Team${t2Id}`
            set.add(`${year}|||${week}|||${t1Name}|||${t2Name}`)
            set.add(`${year}|||${week}|||${t2Name}|||${t1Name}`)
          }
        })
    }
    return set
  }, [brackets, rosterUserMaps, leagues])

  const funStats = useMemo(() => {
    // Scores excluding consolation games
    const validGames = ownerGames.filter(g =>
      g.type === 'R' || !consolationGameKeys.has(`${g.year}|||${g.week}|||${g.team1}|||${g.team2}`)
    )
    const scores = validGames.map(g => ({
      pts: g.team1 === ownerName ? g.pts1 : g.pts2,
      opp: g.team1 === ownerName ? g.team2 : g.team1,
      year: g.year,
      week: g.week,
    })).filter(s => s.pts > 0)

    const bestGame  = scores.length ? scores.reduce((m, s) => s.pts > m.pts ? s : m, scores[0]) : null
    const worstGame = scores.length ? scores.reduce((m, s) => s.pts < m.pts ? s : m, scores[0]) : null

    // Top rival (all games)
    const rivalCount: Record<string, number> = {}
    ownerGames.forEach(g => {
      const opp = g.team1 === ownerName ? g.team2 : g.team1
      rivalCount[opp] = (rivalCount[opp] || 0) + 1
    })
    const topRivalName = Object.entries(rivalCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
    let rivalW = 0, rivalL = 0
    if (topRivalName) {
      ownerGames.forEach(g => {
        const opp = g.team1 === ownerName ? g.team2 : g.team1
        if (opp !== topRivalName) return
        const myPts  = g.team1 === ownerName ? g.pts1 : g.pts2
        const oppPts = g.team1 === ownerName ? g.pts2 : g.pts1
        if (myPts >= oppPts) rivalW++; else rivalL++
      })
    }

    // Longest win streak (all games)
    const sorted = [...ownerGames].sort((a, b) => a.year - b.year || a.week - b.week)
    let maxStreak = 0, curStreak = 0
    let streakStart = sorted.length > 0 ? sorted[0] : null
    let streakEnd   = sorted.length > 0 ? sorted[0] : null
    let tmpStart    = sorted.length > 0 ? sorted[0] : null
    sorted.forEach(g => {
      const myPts  = g.team1 === ownerName ? g.pts1 : g.pts2
      const oppPts = g.team1 === ownerName ? g.pts2 : g.pts1
      if (myPts >= oppPts) {
        if (curStreak === 0) tmpStart = g
        curStreak++
        if (curStreak > maxStreak) { maxStreak = curStreak; streakStart = tmpStart; streakEnd = g }
      } else {
        curStreak = 0
      }
    })

    // Most drafted players
    const playerCount: Record<string, { name: string; count: number; pos: string }> = {}
    Object.entries(draftData).forEach(([yearStr, { picks }]) => {
      const year = Number(yearStr)
      const rMap = rosterUserMaps[year] ?? {}
      picks
        .filter(p => rMap[String(p.roster_id)] === ownerName)
        .forEach(p => {
          const name = [p.metadata.first_name, p.metadata.last_name].filter(Boolean).join(' ')
          if (!name) return
          if (!playerCount[p.player_id]) playerCount[p.player_id] = { name, count: 0, pos: p.metadata.position ?? '' }
          playerCount[p.player_id].count++
        })
    })
    const topPlayers = Object.values(playerCount).sort((a, b) => b.count - a.count).slice(0, 3)

    return { bestGame, worstGame, topRivalName, rivalW, rivalL, maxStreak, streakStart, streakEnd, topPlayers }
  }, [ownerGames, ownerName, consolationGameKeys, draftData, rosterUserMaps])

  if (error) return <ErrorState error={error} />
  if (!loaded) return <LoadingSpinner />

  const seasons = ownerSeasons[ownerName]
  if (!seasons?.length) {
    return (
      <div className="text-center py-16 text-s-text3">
        <div className="text-[48px] mb-4">🤷</div>
        <p>No data found for {ownerName}</p>
        <Link href="/owners" className="mt-4 inline-block text-s-blue hover:underline">← Back to Owners</Link>
      </div>
    )
  }

  const totalW = seasons.reduce((a, s) => a + s.wins, 0)
  const totalL = seasons.reduce((a, s) => a + s.losses, 0)
  const pct = (totalW / (totalW + totalL || 1) * 100).toFixed(1)
  const avgPF = seasons.reduce((a, s) => a + s.pf, 0) / seasons.length
  const avgPA = seasons.reduce((a, s) => a + s.pa, 0) / seasons.length

  const best  = seasons.reduce((b, s) => (s.wins / (s.wins + s.losses || 1)) > (b.wins / (b.wins + b.losses || 1)) ? s : b, seasons[0])
  const worst = seasons.reduce((b, s) => (s.wins / (s.wins + s.losses || 1)) < (b.wins / (b.wins + b.losses || 1)) ? s : b, seasons[0])

  const champs = MANUAL_CHAMPS.filter(c => c.winner?.includes(ownerName))
  const shame  = MANUAL_SHAME.filter(s => s.loser === ownerName)
  const earn   = EARNINGS_DATA.find(e => e.owner === ownerName)

  const allOwnerNames = [...new Set(allMatchups.flatMap(g => [g.team1, g.team2]))]

  const TABS: { id: Tab; label: string }[] = [
    { id: 'seasons', label: 'Season Log' },
    { id: 'h2h',     label: 'H2H Records' },
    { id: 'gamelog', label: `Game Log (${ownerGames.length})` },
  ]

  return (
    <div className="animate-fade-in">
      {/* Back button */}
      <Link
        href="/owners"
        className="inline-flex items-center gap-[6px] px-4 py-2 bg-s-bg3 border border-s-border rounded-[8px] text-s-text2 text-[12px] font-semibold mb-5 hover:border-s-border2 hover:text-s-text transition-all duration-150"
      >
        ← All Owners
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4 mb-5 flex-wrap">
        <OwnerAvatar name={ownerName} size="lg" />
        <div>
          <div className="text-[24px] font-extrabold text-s-text">{ownerName}</div>
          <div className="text-[12px] text-s-text3">
            {seasons.length} seasons · {totalW}W-{totalL}L · {pct}% win rate
          </div>
        </div>
        {/* Badges */}
        <div className="flex gap-2 flex-wrap ml-auto">
          {champs.map(c => (
            <span key={c.year} className="inline-flex items-center px-2 py-[2px] rounded-full text-[10px] font-bold bg-[#3d2000] text-s-gold border border-[#5a3200]">
              🏆 {c.year}{c.half ? ' (½)' : ''} Champ
            </span>
          ))}
          {shame.map(s => (
            <span key={s.year} className="inline-flex items-center px-2 py-[2px] rounded-full text-[10px] font-bold bg-[#3d0000] text-s-red border border-[#5a0000]">
              🚽 {s.year} Shame
            </span>
          ))}
          {earn && (
            <span className={`inline-flex items-center px-2 py-[2px] rounded-full text-[10px] font-bold border ${earn.total >= 0 ? 'bg-[#002d10] text-s-green border-[#004d1a]' : 'bg-[#3d0000] text-s-red border-[#5a0000]'}`}>
              {earn.total >= 0 ? '+' : ''}${earn.total} net
            </span>
          )}
        </div>
      </div>

      {/* Core stat boxes */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-[10px] mb-[10px]">
        <StatBox label="Career Record" value={`${totalW}-${totalL}`} sub={`${pct}% win rate`} />
        <StatBox label="Avg PF/Game" value={(seasons.reduce((a,s)=>a+s.pf,0)/Math.max(1,seasons.reduce((a,s)=>a+s.wins+s.losses,0))).toFixed(1)} sub={`${avgPF.toFixed(0)} pts/season`} />
        <StatBox label="Avg PA/Game" value={(seasons.reduce((a,s)=>a+s.pa,0)/Math.max(1,seasons.reduce((a,s)=>a+s.wins+s.losses,0))).toFixed(1)} sub={`${avgPA.toFixed(0)} pts allowed/season`} valueColor="#f87171" />
        <StatBox label="Best Season"   value={String(best.year)}  sub={`${best.wins}-${best.losses} record`}  valueColor="#22c55e" />
        <StatBox label="Worst Season"  value={String(worst.year)} sub={`${worst.wins}-${worst.losses} record`} valueColor="#ef4444" />
        <StatBox
          label="Net Earnings"
          value={earn ? `${earn.total >= 0 ? '+' : ''}$${earn.total}` : 'N/A'}
          valueColor={earn ? (earn.total >= 0 ? '#22c55e' : '#ef4444') : undefined}
        />
      </div>

      {/* Fun stat boxes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-[10px] mb-5">
        <StatBox
          label="Top Rival"
          value={funStats.topRivalName ?? '—'}
          sub={funStats.topRivalName ? `${funStats.rivalW}-${funStats.rivalL} all-time` : undefined}
        />
        <StatBox
          label="Best Game"
          value={funStats.bestGame ? fmtPts(funStats.bestGame.pts) : '—'}
          sub={funStats.bestGame ? `${funStats.bestGame.year} W${funStats.bestGame.week} vs ${funStats.bestGame.opp}` : undefined}
          valueColor="#22c55e"
        />
        <StatBox
          label="Worst Game"
          value={funStats.worstGame ? fmtPts(funStats.worstGame.pts) : '—'}
          sub={funStats.worstGame ? `${funStats.worstGame.year} W${funStats.worstGame.week} vs ${funStats.worstGame.opp}` : undefined}
          valueColor="#ef4444"
        />
        <StatBox
          label="Longest Win Streak"
          value={funStats.maxStreak > 0 ? `${funStats.maxStreak}W` : '—'}
          sub={funStats.maxStreak > 0 && funStats.streakStart && funStats.streakEnd
            ? `${funStats.streakStart.year} W${funStats.streakStart.week}–W${funStats.streakEnd.week}`
            : undefined}
          valueColor="#f59e0b"
        />
      </div>

      {/* Draft Darlings */}
      {funStats.topPlayers.length > 0 && (
        <div className="gl p-[14px] mb-5">
          <div className="text-[10px] font-bold tracking-[2.5px] uppercase text-s-text3 mb-[10px]">Most Drafted</div>
          <div className="flex flex-wrap gap-2">
            {funStats.topPlayers.map(p => (
              <span
                key={p.name}
                className="inline-flex items-center gap-[6px] px-3 py-[5px] rounded-full text-[11px] font-semibold bg-s-bg3 border border-s-border text-s-text2"
              >
                <span className="text-s-text">{p.name}</span>
                <span className="text-s-text3">·</span>
                <span className="text-s-text3">{p.pos}</span>
                <span className="text-s-text3">·</span>
                <span className="text-s-gold font-bold">{p.count}x</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-s-border mb-4 overflow-x-auto scrollbar-none">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={[
              'px-4 py-[9px] text-[11px] font-bold tracking-[1px] uppercase border-b-2 -mb-[1px] whitespace-nowrap transition-colors duration-150 bg-transparent border-0',
              tab === t.id
                ? 'text-s-gold border-b-2 border-s-gold'
                : 'text-s-text3 border-transparent hover:text-s-text2',
            ].join(' ')}
            style={{ borderBottomWidth: 2, borderBottomColor: tab === t.id ? '#f59e0b' : 'transparent' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Season Log */}
      {tab === 'seasons' && (
        <div className="overflow-x-auto gl">
          <table className="w-full border-collapse min-w-[500px]">
            <thead>
              <tr>
                <th>Year</th><th>Finish</th><th>W</th><th>L</th><th>Win%</th>
                <th>PF/Gm</th><th>PA/Gm</th><th>+/−</th><th>Playoffs</th>
              </tr>
            </thead>
            <tbody>
              {[...seasons].sort((a, b) => a.year - b.year).map(s => {
                const margin = s.pf - s.pa
                const spct = (s.wins / (s.wins + s.losses || 1) * 100).toFixed(1)
                return (
                  <tr key={s.year}>
                    <td><span className="inline-block px-2 py-[2px] rounded-full text-[10px] font-bold bg-s-bg4 text-s-text2 border border-s-border num">{s.year}</span></td>
                    <td><FinishBadge finish={s.finish} /></td>
                    <td className="text-s-green font-bold num">{s.wins}</td>
                    <td className="text-s-red num">{s.losses}</td>
                    <td><WinPctBadge pct={spct} /></td>
                    <td className="text-s-text2 num">{s.wins + s.losses > 0 ? (s.pf / (s.wins + s.losses)).toFixed(1) : '—'}</td>
                    <td className="text-[#f87171] num">{s.wins + s.losses > 0 ? (s.pa / (s.wins + s.losses)).toFixed(1) : '—'}</td>
                    <td className={`num ${margin >= 0 ? 'text-s-green' : 'text-s-red'}`}>
                      {margin >= 0 ? '+' : ''}{margin.toFixed(1)}
                    </td>
                    <td>
                      {s.inPlayoffs
                        ? <span className="inline-flex items-center gap-1 px-2 py-[2px] rounded-full text-[10px] font-bold bg-[#052e16] text-s-green border border-[#166534]" style={{ boxShadow: '0 0 8px #22c55e30' }}>● Clinched</span>
                        : <span className="inline-flex items-center gap-1 px-2 py-[2px] rounded-full text-[10px] font-bold bg-[#450a0a] text-s-red border border-[#7f1d1d]">✕ Elim.</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* H2H Records */}
      {tab === 'h2h' && (
        <H2HGrid ownerName={ownerName} allMatchups={allMatchups} allOwnerNames={allOwnerNames} />
      )}

      {/* Game Log */}
      {tab === 'gamelog' && (
        <div className="max-h-[500px] overflow-y-auto gl rounded-[12px]">
          {ownerGames.map(g => {
            const myPts  = g.team1 === ownerName ? g.pts1 : g.pts2
            const oppPts = g.team1 === ownerName ? g.pts2 : g.pts1
            const opp    = g.team1 === ownerName ? g.team2 : g.team1
            const won    = myPts >= oppPts
            const margin = myPts - oppPts
            return (
              <div
                key={`${g.year}-${g.week}-${g.team1}`}
                className="flex items-center gap-[6px] px-3 py-[9px] border-b border-s-bg3 text-[12px] hover:bg-s-bg3 transition-colors duration-100"
              >
                <span className="w-[60px] text-s-text2 text-[10px] flex-shrink-0 num">{g.year} W{g.week}</span>
                <span className="font-bold w-[72px] flex-shrink-0 overflow-hidden text-ellipsis text-s-text">
                  {ownerName}
                </span>
                <span className="w-[50px] flex-shrink-0 num">{fmtPts(myPts)}</span>
                <span className="text-s-text3 text-[10px] flex-shrink-0">vs</span>
                <span className="font-bold w-[72px] flex-shrink-0 overflow-hidden text-ellipsis text-s-text2">
                  {opp}
                </span>
                <span className="w-[50px] flex-shrink-0 num">{fmtPts(oppPts)}</span>
                <span className={`px-[6px] py-[1px] rounded-[4px] text-[10px] font-extrabold flex-shrink-0 ${won ? 'bg-[#052e16] text-s-green' : 'bg-[#450a0a] text-s-red'}`}>
                  {won ? 'W' : 'L'}
                </span>
                <span className="inline-block px-2 py-[2px] rounded-full text-[10px] font-bold bg-s-bg4 text-s-text3 border border-s-border flex-shrink-0">
                  {g.type === 'R' ? 'REG' : 'PLY'}
                </span>
                <span className={`text-[11px] ml-auto flex-shrink-0 num ${margin >= 0 ? 'text-s-green' : 'text-s-red'}`}>
                  {margin >= 0 ? '+' : ''}{margin.toFixed(1)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
