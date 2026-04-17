'use client'

import React from 'react'
import { useLeague } from '@/context/LeagueContext'
import type { BracketGame } from '@/types'

interface MatchupResult {
  t1Name: string
  t2Name: string
  t1Score: number | null
  t2Score: number | null
  winnerName: string | null
  isChampionship: boolean
}

function resolveScore(
  rosterId: number,
  week: number,
  year: number,
  state: ReturnType<typeof useLeague>['state']
): number | null {
  const weekData = state.matchups[year]?.[week]
  if (!weekData) return null
  const entry = weekData.matchups.find(m => m.roster_id === rosterId)
  return entry?.points ?? null
}

function resolveGameResults(
  games: BracketGame[],
  rMap: Record<string, string>,
  playoffStart: number,
  year: number,
  state: ReturnType<typeof useLeague>['state']
): Map<number, MatchupResult[]> {
  const byRound = new Map<number, MatchupResult[]>()
  for (const g of games) {
    const t1Id = g.t1 ?? null
    const t2Id = g.t2 ?? null
    if (t1Id == null || t2Id == null) continue

    const week = playoffStart + (g.r - 1)
    const t1Name = rMap[String(t1Id)] ?? `Team${t1Id}`
    const t2Name = rMap[String(t2Id)] ?? `Team${t2Id}`
    const t1Score = resolveScore(t1Id, week, year, state)
    const t2Score = resolveScore(t2Id, week, year, state)
    const winnerName = g.w != null ? (rMap[String(g.w)] ?? `Team${g.w}`) : null

    const round = byRound.get(g.r) ?? []
    round.push({ t1Name, t2Name, t1Score, t2Score, winnerName, isChampionship: g.p === 1 })
    byRound.set(g.r, round)
  }
  return byRound
}

function MatchupCard({ result }: { result: MatchupResult }) {
  const { t1Name, t2Name, t1Score, t2Score, winnerName, isChampionship } = result
  const t1Won = winnerName === t1Name
  const t2Won = winnerName === t2Name

  return (
    <div className={`border rounded-[8px] p-[10px] ${isChampionship ? 'bg-[#1e1a00] border-[#5a3800]' : 'bg-[#1e1e2e] border-s-border'}`}>
      {isChampionship && (
        <div className="text-[9px] font-bold uppercase tracking-[1.5px] text-s-gold mb-[6px]">🏆 Championship</div>
      )}
      <div className="flex flex-col gap-[4px]">
        {[
          { name: t1Name, score: t1Score, won: t1Won },
          { name: t2Name, score: t2Score, won: t2Won },
        ].map(({ name, score, won }) => (
          <div
            key={name}
            className={`flex items-center justify-between gap-2 px-[8px] py-[5px] rounded-[5px] ${won ? 'bg-[#1a2e1a]' : ''}`}
          >
            <span className={`text-[12px] font-semibold truncate ${won ? 'text-s-text' : 'text-s-text3'}`}>{name}</span>
            <span className={`font-mono text-[12px] flex-shrink-0 ${won ? 'text-s-green font-bold' : 'text-s-text3'}`}>
              {score != null ? score.toFixed(2) : winnerName != null ? '—' : 'TBD'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Draws connecting lines between two consecutive rounds.
 *  fromCount games → toCount games.
 *  - Equal counts: straight horizontal line per game
 *  - fromCount > toCount: bracket ┤ shape grouping pairs into one output
 */
function RoundConnector({ fromCount, toCount }: { fromCount: number; toCount: number }) {
  const color = '#3a4060'
  const W = 32
  const mid = W / 2

  const lines: React.ReactNode[] = []

  if (fromCount === toCount) {
    for (let i = 0; i < fromCount; i++) {
      const pct = ((2 * i + 1) / (2 * fromCount)) * 100
      lines.push(
        <div key={i} className="absolute" style={{
          top: `calc(${pct}% - 1px)`, left: 0, right: 0, height: 2, background: color,
        }} />
      )
    }
  } else {
    const groupSize = fromCount / toCount
    for (let g = 0; g < toCount; g++) {
      const firstIdx = g * groupSize
      const lastIdx = (g + 1) * groupSize - 1
      const firstCtr = ((2 * firstIdx + 1) / (2 * fromCount)) * 100
      const lastCtr  = ((2 * lastIdx  + 1) / (2 * fromCount)) * 100
      const midCtr   = (firstCtr + lastCtr) / 2

      // Horizontal arms from each input game → vertical bar
      for (let k = 0; k < groupSize; k++) {
        const ctr = ((2 * (firstIdx + k) + 1) / (2 * fromCount)) * 100
        lines.push(
          <div key={`arm-${g}-${k}`} className="absolute" style={{
            top: `calc(${ctr}% - 1px)`, left: 0, width: mid, height: 2, background: color,
          }} />
        )
      }
      // Vertical bar
      lines.push(
        <div key={`vbar-${g}`} className="absolute" style={{
          top: `${firstCtr}%`, height: `${lastCtr - firstCtr}%`,
          left: mid - 1, width: 2, background: color,
        }} />
      )
      // Output arm → next round
      lines.push(
        <div key={`out-${g}`} className="absolute" style={{
          top: `calc(${midCtr}% - 1px)`, left: mid, right: 0, height: 2, background: color,
        }} />
      )
    }
  }

  return (
    <div className="relative self-stretch flex-shrink-0" style={{ width: W }}>
      {lines}
    </div>
  )
}

function RoundColumn({ games }: { games: MatchupResult[] }) {
  return (
    <div className="flex-1 flex flex-col min-w-[170px]">
      {games.map((result, i) => (
        <div key={i} className="flex-1 flex flex-col justify-center py-[5px]">
          <MatchupCard result={result} />
        </div>
      ))}
    </div>
  )
}

interface Props {
  year: number
}

export default function PlayoffBracket({ year }: Props) {
  const { state } = useLeague()
  const { brackets, rosterUserMaps, leagues } = state

  const bracket = brackets[year]
  const rMap = rosterUserMaps[year] ?? {}
  const playoffStart = leagues[year]?.settings?.playoff_week_start ?? 15

  if (!bracket) {
    return (
      <div className="rounded-[12px] bg-[#252535] p-[18px] text-center text-s-text3 text-[12px]">
        No bracket data available for {year}
      </div>
    )
  }

  // Championship path only — exclude consolation games (p=3, p=5)
  const champGames = (bracket.winners ?? []).filter(g => !g.p || g.p === 1)
  const winnersRounds = resolveGameResults(champGames, rMap, playoffStart, year, state)
  const rounds = [...winnersRounds.keys()].sort((a, b) => a - b)

  if (rounds.length === 0) {
    return (
      <div className="rounded-[12px] bg-[#252535] p-[18px] text-center text-s-text3 text-[12px]">
        Bracket not yet available for {year}
      </div>
    )
  }

  const maxRound = rounds[rounds.length - 1]

  function roundLabel(r: number): string {
    if (r === maxRound) return `Wk ${playoffStart + r - 1} — Finals`
    if (r === maxRound - 1) return `Wk ${playoffStart + r - 1} — Semifinals`
    return `Wk ${playoffStart + r - 1} — Quarterfinals`
  }

  return (
    <div className="rounded-[12px] bg-[#252535] p-[18px] mt-4">
      <div className="text-[10px] font-bold tracking-[3px] uppercase text-s-text3 mb-4">
        {year} Playoff Bracket
      </div>

      <div className="overflow-x-auto">
        <div style={{ minWidth: rounds.length * 170 + (rounds.length - 1) * 32 }}>

          {/* Round header labels */}
          <div className="flex gap-0 mb-3">
            {rounds.map((r, i) => (
              <React.Fragment key={r}>
                <div className="flex-1 text-center text-[9px] uppercase tracking-[1px] text-s-text3 min-w-[170px]">
                  {roundLabel(r)}
                </div>
                {i < rounds.length - 1 && <div style={{ width: 32, flexShrink: 0 }} />}
              </React.Fragment>
            ))}
          </div>

          {/* Bracket body */}
          <div className="flex items-stretch">
            {rounds.map((r, roundIdx) => {
              const games     = winnersRounds.get(r) ?? []
              const nextGames = roundIdx < rounds.length - 1
                ? (winnersRounds.get(rounds[roundIdx + 1]) ?? [])
                : []
              return (
                <React.Fragment key={r}>
                  <RoundColumn games={games} />
                  {roundIdx < rounds.length - 1 && (
                    <RoundConnector fromCount={games.length} toCount={nextGames.length} />
                  )}
                </React.Fragment>
              )
            })}
          </div>

        </div>
      </div>
    </div>
  )
}
