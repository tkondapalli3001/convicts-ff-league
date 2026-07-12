'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useLeague } from '@/context/LeagueContext'
import { fmtPts, ownerColor, fullNameInitials } from '@/lib/utils'
import { MANUAL_CHAMPS, MANUAL_SHAME, EARNINGS_DATA } from '@/lib/constants'
import { buildConsolationGameKeys, excludeManualGames, gameKey, playoffByeYears } from '@/lib/stats'
import { isSeasonComplete } from '@/lib/data-processing'
import FinishBadge from '@/components/shared/FinishBadge'
import WinPctBadge from '@/components/shared/WinPctBadge'
import H2HGrid from './H2HGrid'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ErrorState from '@/components/shared/ErrorState'

type Tab = 'seasons' | 'h2h' | 'gamelog'

export default function OwnerDetail({ ownerName }: { ownerName: string }) {
  const { state } = useLeague()
  const { loaded, error, ownerSeasons, allMatchups, brackets, rosterUserMaps, leagues, draftData, matchups } = state
  const [tab, setTab] = useState<Tab>('seasons')

  // Must be before early returns (React hook rules)
  const ownerGames = useMemo(
    () => allMatchups.filter(g => g.team1 === ownerName || g.team2 === ownerName),
    [allMatchups, ownerName]
  )

  const consolationGameKeys = useMemo(
    () => buildConsolationGameKeys({ brackets, rosterUserMaps, leagues }),
    [brackets, rosterUserMaps, leagues]
  )

  const nonConsolationGames = useMemo(
    () => excludeManualGames(ownerGames).filter(g =>
      g.type === 'R' || !consolationGameKeys.has(gameKey(g.year, g.week, g.team1, g.team2))
    ),
    [ownerGames, consolationGameKeys]
  )

  const allMatchupsFiltered = useMemo(
    () => excludeManualGames(allMatchups).filter(g =>
      g.type === 'R' || !consolationGameKeys.has(gameKey(g.year, g.week, g.team1, g.team2))
    ),
    [allMatchups, consolationGameKeys]
  )

  const funStats = useMemo(() => {
    const scores = nonConsolationGames.map(g => ({
      pts: g.team1 === ownerName ? g.pts1 : g.pts2,
      opp: g.team1 === ownerName ? g.team2 : g.team1,
      year: g.year,
      week: g.week,
    })).filter(s => s.pts > 0)

    const bestGame  = scores.length ? scores.reduce((m, s) => s.pts > m.pts ? s : m, scores[0]) : null
    const worstGame = scores.length ? scores.reduce((m, s) => s.pts < m.pts ? s : m, scores[0]) : null

    // Top rival = opponent who has defeated this owner the most
    const rivalLossCount: Record<string, number> = {}
    nonConsolationGames.forEach(g => {
      const opp    = g.team1 === ownerName ? g.team2 : g.team1
      const myPts  = g.team1 === ownerName ? g.pts1 : g.pts2
      const oppPts = g.team1 === ownerName ? g.pts2 : g.pts1
      if (oppPts > myPts) rivalLossCount[opp] = (rivalLossCount[opp] || 0) + 1
    })
    const topRivalName = Object.entries(rivalLossCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
    let rivalW = 0, rivalL = 0
    if (topRivalName) {
      nonConsolationGames.forEach(g => {
        const opp = g.team1 === ownerName ? g.team2 : g.team1
        if (opp !== topRivalName) return
        const myPts  = g.team1 === ownerName ? g.pts1 : g.pts2
        const oppPts = g.team1 === ownerName ? g.pts2 : g.pts1
        if (myPts >= oppPts) rivalW++; else rivalL++
      })
    }

    // Longest win streak (regular season + championship path only)
    const sorted = [...nonConsolationGames].sort((a, b) => a.year - b.year || a.week - b.week)
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

    // Top scorers — players with most total points started for this owner, excluding DEF
    // Build name + position lookup from all draft picks
    const playerNameMap: Record<string, string> = {}
    const playerPosMap: Record<string, string> = {}
    Object.values(draftData).forEach(({ picks }) => {
      picks.forEach(p => {
        if (!playerNameMap[p.player_id])
          playerNameMap[p.player_id] = [p.metadata.first_name, p.metadata.last_name].filter(Boolean).join(' ')
        if (!playerPosMap[p.player_id])
          playerPosMap[p.player_id] = p.metadata.position ?? ''
      })
    })

    // Find this owner's roster_id for each year
    const ownerRosterIds: Record<number, number> = {}
    Object.entries(rosterUserMaps).forEach(([yearStr, rMap]) => {
      const year = Number(yearStr)
      const entry = Object.entries(rMap).find(([, name]) => name === ownerName)
      if (entry) ownerRosterIds[year] = Number(entry[0])
    })

    // Accumulate starter points per player across all weeks/years
    const playerPts: Record<string, { name: string; pos: string; pts: number }> = {}
    Object.entries(matchups).forEach(([yearStr, weeks]) => {
      const year = Number(yearStr)
      if (!isSeasonComplete(leagues[year])) return
      const rId = ownerRosterIds[year]
      if (rId == null) return
      Object.values(weeks).forEach(({ matchups: weekMatchups }) => {
        const myMatchup = weekMatchups.find(m => m.roster_id === rId)
        if (!myMatchup?.starters?.length || !myMatchup.starters_points?.length) return
        myMatchup.starters.forEach((playerId, i) => {
          const pos = playerPosMap[playerId] ?? ''
          // Exclude defenses by position or by team-abbreviation ID (Sleeper uses e.g. "NE", "KC")
          if (pos === 'DEF' || /^[A-Z]{2,3}$/.test(playerId)) return
          const pts = myMatchup.starters_points![i] ?? 0
          if (pts <= 0) return
          if (!playerPts[playerId])
            playerPts[playerId] = { name: playerNameMap[playerId] || playerId, pos, pts: 0 }
          playerPts[playerId].pts += pts
        })
      })
    })
    const topScorers = Object.values(playerPts).sort((a, b) => b.pts - a.pts).slice(0, 5)

    return { bestGame, worstGame, topRivalName, rivalW, rivalL, maxStreak, streakStart, streakEnd, topScorers }
  }, [nonConsolationGames, ownerName, draftData, rosterUserMaps, matchups, leagues])

  const playoffStats = useMemo(() => {
    let finalsW = 0
    let finalsL = 0

    for (const [yearStr, bracket] of Object.entries(brackets)) {
      const year = Number(yearStr)
      // Finals results only count once the season is complete
      if (!isSeasonComplete(leagues[year])) continue
      const rMap = rosterUserMaps[year] ?? {}
      const ownerEntry = Object.entries(rMap).find(([, name]) => name === ownerName)
      if (!ownerEntry) continue
      const rId = Number(ownerEntry[0])

      const champGame = bracket.winners?.find(g => g.p === 1)
      if (champGame) {
        if (champGame.w === rId) finalsW++
        else if (champGame.l === rId) finalsL++
      }
    }

    const byes = playoffByeYears({ brackets, rosterUserMaps, leagues })[ownerName]?.length ?? 0

    return { finalsW, finalsL, byes }
  }, [brackets, rosterUserMaps, leagues, ownerName])

  if (error) return <ErrorState error={error} />
  if (!loaded) return <LoadingSpinner />

  const seasons = ownerSeasons[ownerName]
  if (!seasons?.length) {
    return (
      <div className="text-center py-16 text-s-text3">
        <div className="text-[48px] mb-4">🤷</div>
        <p>No data found for {ownerName}</p>
        <Link href="/owners" className="mt-4 inline-block text-gold-soft hover:underline">← Back to Owners</Link>
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

  const allOwnerNames = [...new Set(allMatchupsFiltered.flatMap(g => [g.team1, g.team2]))]

  const TABS: { id: Tab; label: string }[] = [
    { id: 'seasons', label: 'Season Log' },
    { id: 'h2h',     label: 'H2H Records' },
    { id: 'gamelog', label: `Game Log (${nonConsolationGames.length})` },
  ]

  // ── Owner stat grid (design 4a) — 12 cells, semantically coloured Barlow values ──────
  const games  = seasons.reduce((a, s) => a + s.wins + s.losses, 0)
  const avgPFg = (seasons.reduce((a, s) => a + s.pf, 0) / Math.max(1, games)).toFixed(1)
  const avgPAg = (seasons.reduce((a, s) => a + s.pa, 0) / Math.max(1, games)).toFixed(1)
  const SAGE = '#7FA886', BRICK = '#B4636B', GOLD = '#C9A24B'
  const finalsGames = playoffStats.finalsW + playoffStats.finalsL

  const statCells: { label: string; value: string; sub?: string; color?: string }[] = [
    { label: 'Career Record', value: `${totalW}–${totalL}`, sub: `${pct}% win rate` },
    { label: 'Avg PF / Game', value: avgPFg, sub: `${avgPF.toFixed(0)} pts/season` },
    { label: 'Avg PA / Game', value: avgPAg, sub: `${avgPA.toFixed(0)} allowed/season`, color: BRICK },
    { label: 'Net Earnings', value: earn ? `${earn.total >= 0 ? '+' : '−'}$${Math.abs(earn.total)}` : 'N/A', color: earn ? (earn.total >= 0 ? SAGE : BRICK) : undefined },
    { label: 'Finals Record', value: finalsGames > 0 ? `${playoffStats.finalsW}–${playoffStats.finalsL}` : '—', sub: finalsGames > 0 ? `${finalsGames} Finals appearance${finalsGames !== 1 ? 's' : ''}` : 'Never reached Finals', color: playoffStats.finalsW > 0 ? GOLD : undefined },
    { label: 'Playoff Byes', value: playoffStats.byes > 0 ? String(playoffStats.byes) : '—', sub: playoffStats.byes > 0 ? `first-round bye${playoffStats.byes !== 1 ? 's' : ''}` : 'No byes earned', color: playoffStats.byes > 0 ? GOLD : undefined },
    { label: 'Best Season', value: String(best.year), sub: `${best.wins}–${best.losses} record`, color: SAGE },
    { label: 'Worst Season', value: String(worst.year), sub: `${worst.wins}–${worst.losses} record`, color: BRICK },
    { label: 'Top Rival', value: funStats.topRivalName ?? '—', sub: funStats.topRivalName ? `${funStats.rivalW}–${funStats.rivalL} vs them` : undefined },
    { label: 'Best Game', value: funStats.bestGame ? fmtPts(funStats.bestGame.pts) : '—', sub: funStats.bestGame ? `${funStats.bestGame.year} W${funStats.bestGame.week} vs ${funStats.bestGame.opp}` : undefined, color: SAGE },
    { label: 'Worst Game', value: funStats.worstGame ? fmtPts(funStats.worstGame.pts) : '—', sub: funStats.worstGame ? `${funStats.worstGame.year} W${funStats.worstGame.week} vs ${funStats.worstGame.opp}` : undefined, color: BRICK },
    { label: 'Longest Win Streak', value: funStats.maxStreak > 0 ? `${funStats.maxStreak}W` : '—', sub: funStats.maxStreak > 0 && funStats.streakStart && funStats.streakEnd ? `${funStats.streakStart.year} W${funStats.streakStart.week}–W${funStats.streakEnd.week}` : undefined, color: GOLD },
  ]

  return (
    <div className="animate-fade-in">
      {/* ── Profile header band (design 4a) ─────────────────────────── */}
      <div
        className="-mx-4 -mt-6 overflow-hidden border-b px-4 pb-8 pt-8 sm:px-8"
        style={{
          borderColor: 'rgba(var(--gold-rgb), 0.12)',
          background:
            'radial-gradient(ellipse 70% 90% at 50% -20%, rgba(var(--gold2-rgb), 0.10) 0%, transparent 60%), #050506',
        }}
      >
        <Link
          href="/owners"
          className="mb-6 inline-flex items-center gap-2 border px-3.5 py-[7px] text-[9px] font-bold uppercase tracking-[2px] text-s-text2 transition-colors hover:text-gold-soft"
          style={{ borderColor: 'rgba(var(--gold-rgb), 0.20)' }}
        >
          ← All Owners
        </Link>

        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-5 sm:gap-6">
            <div
              className="flex h-[76px] w-[76px] flex-shrink-0 items-center justify-center rounded-full font-display text-[28px] font-extrabold text-white"
              style={{
                background: ownerColor(ownerName),
                boxShadow: '0 0 0 2px #050506, 0 0 0 3.5px #C9962E, 0 0 24px rgba(201,150,46,0.35)',
              }}
            >
              {fullNameInitials(ownerName)}
            </div>
            <div>
              <div className="mb-2 flex items-center gap-3.5">
                <span className="h-px w-8" style={{ background: 'linear-gradient(to right, transparent, #C9962E)' }} />
                <span className="text-[9px] font-bold uppercase tracking-[5px] text-gold-soft">Manager Profile</span>
              </div>
              <h1 className="text-hero-gold font-display text-[44px] font-extrabold uppercase leading-[0.95] tracking-[1px] sm:text-[64px] sm:tracking-[2px]">
                {ownerName}
              </h1>
              <div className="mt-2.5 text-[11px] font-medium uppercase tracking-[1.5px] text-s-text2">
                {seasons.length} Seasons · {totalW}W–{totalL}L · {pct}% Win Rate
              </div>
            </div>
          </div>

          {/* Badge chips */}
          <div className="flex flex-wrap gap-2.5 sm:justify-end">
            {champs.map(c => (
              <span key={c.year} className="border px-4 py-2 text-[10px] font-bold uppercase tracking-[2px] text-gold-soft" style={{ borderColor: 'rgba(var(--gold-rgb), 0.35)' }}>
                {c.year}{c.half ? ' ½' : ''} Champ
              </span>
            ))}
            {shame.map(s => (
              <span key={s.year} className="border px-4 py-2 text-[10px] font-bold uppercase tracking-[2px] text-loss" style={{ borderColor: 'rgba(180,90,90,0.35)' }}>
                {s.year} Shame
              </span>
            ))}
            {earn && (
              <span className="border px-4 py-2 text-[10px] font-bold uppercase tracking-[2px]" style={{ color: earn.total >= 0 ? '#7FA886' : '#B4636B', borderColor: earn.total >= 0 ? 'rgba(127,168,134,0.35)' : 'rgba(180,90,90,0.35)' }}>
                {earn.total >= 0 ? '+' : '−'}${Math.abs(earn.total)} Net
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Stat grid — 12 hairline cells (4-col desktop / 2-col mobile) ─── */}
      <div className="-mx-4 grid grid-cols-2 sm:grid-cols-4">
        {statCells.map((c, i) => (
          <div
            key={i}
            className="flex flex-col gap-1.5 border-b border-r px-5 py-[22px] transition-colors hover:bg-[rgba(201,150,46,0.04)] sm:px-8"
            style={{ borderColor: 'rgba(var(--gold-rgb), 0.08)' }}
          >
            <div className="text-[9px] font-bold uppercase tracking-[3px] text-s-text3">{c.label}</div>
            <div className="font-display text-[28px] font-bold leading-none sm:text-[34px]" style={{ color: c.color ?? '#EDE9E0' }}>
              {c.value}
            </div>
            {c.sub && <div className="truncate text-[10px] font-semibold uppercase tracking-[1px] text-gold-soft">{c.sub}</div>}
          </div>
        ))}
      </div>

      {/* ── Top scorers band ─────────────────────────────────────────── */}
      {funStats.topScorers.length > 0 && (
        <div className="-mx-4 flex flex-wrap items-center gap-4 border-b bg-panel-2 px-4 py-[18px] sm:px-8" style={{ borderColor: 'rgba(var(--gold-rgb), 0.12)' }}>
          <div className="flex flex-shrink-0 items-center gap-2.5">
            <span className="h-px w-4 bg-gold" />
            <span className="text-[10px] font-bold uppercase tracking-[3px] text-gold-soft">Top Scorers</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {funStats.topScorers.map(p => (
              <span
                key={p.name}
                className="inline-flex items-center gap-2 border px-3.5 py-1.5 text-[11px]"
                style={{ borderColor: 'rgba(var(--gold-rgb), 0.16)', background: '#0B0B0D' }}
              >
                <span className="font-bold text-s-text">{p.name}</span>
                <span className="text-s-text3">{p.pos}</span>
                <span className="font-display text-[14px] font-bold text-gold-soft">{p.pts.toFixed(1)}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Tabs (underline) ─────────────────────────────────────────── */}
      <div className="-mx-4 mb-6 flex overflow-x-auto border-b bg-panel-2 px-4 scrollbar-none sm:px-8" style={{ borderColor: 'rgba(var(--gold-rgb), 0.12)' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={[
              '-mb-px whitespace-nowrap border-b-2 px-3.5 py-3.5 text-[10px] font-bold uppercase tracking-[2px] transition-colors duration-150',
              tab === t.id ? 'border-gold text-s-text' : 'border-transparent text-s-text3 hover:text-gold-soft',
            ].join(' ')}
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
                    <td className="font-display text-[17px] font-bold text-s-text2">{s.year}</td>
                    <td><FinishBadge finish={s.finish} /></td>
                    <td className="font-display text-[17px] font-bold" style={{ color: '#7FA886' }}>{s.wins}</td>
                    <td className="font-display text-[17px] font-bold" style={{ color: '#B4636B' }}>{s.losses}</td>
                    <td><WinPctBadge pct={spct} /></td>
                    <td className="text-right font-display text-[17px] font-semibold text-s-text2 num">{s.wins + s.losses > 0 ? (s.pf / (s.wins + s.losses)).toFixed(1) : '—'}</td>
                    <td className="text-right font-display text-[17px] font-semibold num" style={{ color: '#B4636B' }}>{s.wins + s.losses > 0 ? (s.pa / (s.wins + s.losses)).toFixed(1) : '—'}</td>
                    <td className="text-right font-display text-[17px] font-bold num" style={{ color: margin >= 0 ? '#7FA886' : '#B4636B' }}>
                      {margin >= 0 ? '+' : ''}{margin.toFixed(1)}
                    </td>
                    <td className="text-right">
                      {s.inPlayoffs
                        ? <span className="inline-flex items-center gap-1 rounded-[2px] px-2 py-[3px] text-[9px] font-bold uppercase tracking-[1px]" style={{ color: '#7FA886', background: 'rgba(127,168,134,0.12)' }}>● Clinched</span>
                        : <span className="inline-flex items-center gap-1 rounded-[2px] px-2 py-[3px] text-[9px] font-bold uppercase tracking-[1px]" style={{ color: '#B4636B', background: 'rgba(180,99,107,0.12)' }}>✕ Elim.</span>}
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
        <H2HGrid ownerName={ownerName} allMatchups={allMatchupsFiltered} allOwnerNames={allOwnerNames} />
      )}

      {/* Game Log */}
      {tab === 'gamelog' && (
        <div
          className="max-h-[500px] overflow-y-auto rounded-[6px]"
          style={{ background: '#0B0B0D', border: '1px solid rgba(var(--gold-rgb), 0.12)' }}
        >
          {nonConsolationGames.map(g => {
            const myPts  = g.team1 === ownerName ? g.pts1 : g.pts2
            const oppPts = g.team1 === ownerName ? g.pts2 : g.pts1
            const opp    = g.team1 === ownerName ? g.team2 : g.team1
            const won    = myPts >= oppPts
            const margin = myPts - oppPts
            return (
              <div
                key={`${g.year}-${g.week}-${g.team1}`}
                className="flex items-center gap-2 border-b px-4 py-2.5 text-[12px] transition-colors last:border-b-0 hover:bg-[rgba(201,150,46,0.05)]"
                style={{ borderColor: 'rgba(255,255,255,0.04)' }}
              >
                <span className="w-[54px] flex-shrink-0 text-[10px] uppercase tracking-[0.5px] text-s-text3">{g.year} W{g.week}</span>
                <span className="w-[70px] flex-shrink-0 truncate font-bold text-s-text">{ownerName}</span>
                <span className="w-[52px] flex-shrink-0 font-display text-[16px] font-bold text-gold-bright">{fmtPts(myPts)}</span>
                <span className="flex-shrink-0 text-[10px] text-s-text3">vs</span>
                <span className="w-[70px] flex-shrink-0 truncate font-bold text-s-text2">{opp}</span>
                <span className="w-[52px] flex-shrink-0 font-display text-[16px] font-semibold text-s-text3">{fmtPts(oppPts)}</span>
                <span
                  className="flex-shrink-0 rounded-[2px] px-[6px] py-[1px] text-[10px] font-extrabold"
                  style={won ? { color: '#7FA886', background: 'rgba(127,168,134,0.12)' } : { color: '#B4636B', background: 'rgba(180,99,107,0.12)' }}
                >
                  {won ? 'W' : 'L'}
                </span>
                <span
                  className="flex-shrink-0 rounded-[2px] border px-2 py-[1px] text-[9px] font-bold uppercase tracking-[1px] text-s-text3"
                  style={{ borderColor: 'rgba(var(--gold-rgb), 0.14)' }}
                >
                  {g.type === 'R' ? 'REG' : 'PLY'}
                </span>
                <span className="ml-auto flex-shrink-0 font-display text-[16px] font-bold num" style={{ color: margin >= 0 ? '#7FA886' : '#B4636B' }}>
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
