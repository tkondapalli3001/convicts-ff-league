'use client'

import React, { useState, useEffect } from 'react'
import { useLeague } from '@/context/LeagueContext'
import { getPlayersCache, playerDisplayName } from '@/lib/players-cache'
import { ownerColor } from '@/lib/utils'
import type { BracketGame, SleeperMatchup } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface MatchupResult {
  t1Name: string
  t2Name: string
  t1Score: number | null
  t2Score: number | null
  winnerName: string | null
  isChampionship: boolean
  t1RosterId: number | null
  t2RosterId: number | null
  week: number
}

interface GameDetail {
  result: MatchupResult
  year: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
    round.push({
      t1Name, t2Name, t1Score, t2Score, winnerName,
      isChampionship: g.p === 1,
      t1RosterId: t1Id,
      t2RosterId: t2Id,
      week,
    })
    byRound.set(g.r, round)
  }
  return byRound
}

// ─── Game Detail Modal ────────────────────────────────────────────────────────

function GameDetailModal({ detail, onClose }: { detail: GameDetail; onClose: () => void }) {
  const { state } = useLeague()
  const { result, year } = detail
  const [playerNames, setPlayerNames] = useState<Record<string, string>>({})

  useEffect(() => {
    getPlayersCache().then(cache => {
      const names: Record<string, string> = {}
      for (const [id, meta] of Object.entries(cache)) {
        names[id] = playerDisplayName(meta, id)
      }
      setPlayerNames(names)
    })
  }, [])

  const weekData = state.matchups[year]?.[result.week]
  const t1Raw: SleeperMatchup | undefined = result.t1RosterId != null
    ? weekData?.matchups.find(m => m.roster_id === result.t1RosterId)
    : undefined
  const t2Raw: SleeperMatchup | undefined = result.t2RosterId != null
    ? weekData?.matchups.find(m => m.roster_id === result.t2RosterId)
    : undefined

  const t1Won = result.winnerName === result.t1Name
  const t2Won = result.winnerName === result.t2Name
  const t1Color = ownerColor(result.t1Name)
  const t2Color = ownerColor(result.t2Name)

  function StarterRows({ raw, won }: { raw: SleeperMatchup | undefined; won: boolean }) {
    if (!raw?.starters?.length) {
      return <div className="text-[11px] text-s-text3 px-4 py-3">No starter data available</div>
    }
    const starters = raw.starters
    const pts = raw.starters_points ?? []
    const allPts = raw.players_points ?? {}

    return (
      <div className="divide-y divide-s-border/30">
        {starters.map((pid, idx) => {
          const score = pts[idx] ?? allPts[pid] ?? null
          const name = playerNames[pid] ?? `#${pid}`
          return (
            <div key={pid} className="flex items-center justify-between px-4 py-[7px]">
              <span className="text-[12px] text-s-text2 truncate max-w-[60%]">{name}</span>
              <span
                className="text-[13px] font-bold num flex-shrink-0"
                style={{ color: (score ?? 0) >= 20 ? '#E8CE8A' : '#EDE9E0' }}
              >
                {score != null ? score.toFixed(2) : '—'}
              </span>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(8,12,20,0.88)', backdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="gl w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[20px]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-s-border/60">
          <div>
            <div className="text-[9px] font-bold tracking-[2.5px] uppercase text-s-text3 mb-1">
              {result.isChampionship ? '🏆 Championship · ' : ''}Wk {result.week} · {year}
            </div>
            <div className="text-[15px] font-black text-s-text">
              {result.t1Name} vs {result.t2Name}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-s-bg3 flex items-center justify-center text-s-text3 hover:text-s-text text-[18px] leading-none transition-colors"
          >
            ×
          </button>
        </div>

        {/* Score banner */}
        <div className="grid grid-cols-2 divide-x divide-s-border/60">
          {[
            { name: result.t1Name, score: result.t1Score, won: t1Won, color: t1Color, raw: t1Raw },
            { name: result.t2Name, score: result.t2Score, won: t2Won, color: t2Color, raw: t2Raw },
          ].map(({ name, score, won, color }) => (
            <div
              key={name}
              className="p-5 text-center"
              style={{ background: won ? `${color}10` : 'transparent' }}
            >
              <div className="text-[11px] font-bold text-s-text3 mb-1 truncate">{name}</div>
              <div
                className="text-[40px] font-black leading-none num"
                style={{ color: won ? color : '#9AA0AC' }}
              >
                {score != null ? score.toFixed(2) : '—'}
              </div>
              {won && (
                <div className="text-[9px] font-bold tracking-[2px] uppercase mt-1" style={{ color }}>
                  Winner
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Starters */}
        {(t1Raw || t2Raw) && (
          <div className="grid grid-cols-2 divide-x divide-s-border/60 border-t border-s-border/60">
            {[
              { name: result.t1Name, raw: t1Raw, won: t1Won },
              { name: result.t2Name, raw: t2Raw, won: t2Won },
            ].map(({ name, raw, won }) => (
              <div key={name}>
                <div
                  className="px-4 py-2 text-[9px] font-bold tracking-[2px] uppercase border-b border-s-border/40"
                  style={{ color: ownerColor(name), background: `${ownerColor(name)}0a` }}
                >
                  {name} — Starters
                  {won && <span className="ml-2 text-s-green">✓ W</span>}
                </div>
                <StarterRows raw={raw} won={won} />
              </div>
            ))}
          </div>
        )}

        {!t1Raw && !t2Raw && (
          <div className="px-6 py-6 text-center text-[12px] text-s-text3">
            Detailed starter data not available for this matchup.
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Matchup Card ─────────────────────────────────────────────────────────────

function MatchupCard({
  result,
  onClick,
}: {
  result: MatchupResult
  onClick: () => void
}) {
  const { t1Name, t2Name, t1Score, t2Score, winnerName, isChampionship } = result
  const t1Won = winnerName === t1Name
  const t2Won = winnerName === t2Name

  return (
    <div
      className={`border rounded-[6px] p-[10px] cursor-pointer transition-colors duration-150
        ${isChampionship ? 'bg-[rgba(201,150,46,0.08)] border-[rgba(230,190,90,0.25)] hover:border-[rgba(230,190,90,0.4)]' : 'hover:bg-[rgba(201,150,46,0.05)]'}`}
      style={!isChampionship ? { background: '#0B0B0D', borderColor: 'rgba(var(--gold-rgb), 0.10)' } : undefined}
      onClick={onClick}
      title="Click to view game details"
    >
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
            className="flex items-center justify-between gap-2 rounded-[4px] px-[8px] py-[5px]"
            style={won ? { background: 'rgba(127,168,134,0.12)' } : undefined}
          >
            <span className={`text-[12px] font-semibold truncate ${won ? 'text-s-text' : 'text-s-text3'}`}>{name}</span>
            <span className="flex-shrink-0 font-display text-[15px] font-bold" style={{ color: won ? '#7FA886' : '#5C6270' }}>
              {score != null ? score.toFixed(2) : winnerName != null ? '—' : 'TBD'}
            </span>
          </div>
        ))}
      </div>
      <div className="text-[8px] text-s-text3/60 text-right mt-1.5 tracking-wide">tap for details</div>
    </div>
  )
}

// ─── Connector Lines ──────────────────────────────────────────────────────────

function RoundConnector({ fromCount, toCount }: { fromCount: number; toCount: number }) {
  const color = 'rgba(201,150,46,0.25)'
  const W = 32
  const mid = W / 2
  const lines: React.ReactNode[] = []

  if (fromCount === toCount) {
    for (let i = 0; i < fromCount; i++) {
      const pct = ((2 * i + 1) / (2 * fromCount)) * 100
      lines.push(
        <div key={i} className="absolute" style={{ top: `calc(${pct}% - 1px)`, left: 0, right: 0, height: 2, background: color }} />
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

      for (let k = 0; k < groupSize; k++) {
        const ctr = ((2 * (firstIdx + k) + 1) / (2 * fromCount)) * 100
        lines.push(
          <div key={`arm-${g}-${k}`} className="absolute"
            style={{ top: `calc(${ctr}% - 1px)`, left: 0, width: mid, height: 2, background: color }} />
        )
      }
      lines.push(
        <div key={`vbar-${g}`} className="absolute"
          style={{ top: `${firstCtr}%`, height: `${lastCtr - firstCtr}%`, left: mid - 1, width: 2, background: color }} />
      )
      lines.push(
        <div key={`out-${g}`} className="absolute"
          style={{ top: `calc(${midCtr}% - 1px)`, left: mid, right: 0, height: 2, background: color }} />
      )
    }
  }

  return (
    <div className="relative self-stretch flex-shrink-0" style={{ width: W }}>
      {lines}
    </div>
  )
}

function RoundColumn({ games, onGameClick }: { games: MatchupResult[]; onGameClick: (r: MatchupResult) => void }) {
  return (
    <div className="flex-1 flex flex-col min-w-[170px]">
      {games.map((result, i) => (
        <div key={i} className="flex-1 flex flex-col justify-center py-[5px]">
          <MatchupCard result={result} onClick={() => onGameClick(result)} />
        </div>
      ))}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  year: number
}

export default function PlayoffBracket({ year }: Props) {
  const { state } = useLeague()
  const { brackets, rosterUserMaps, leagues } = state
  const [selectedGame, setSelectedGame] = useState<GameDetail | null>(null)

  const bracket = brackets[year]
  const rMap = rosterUserMaps[year] ?? {}
  const playoffStart = leagues[year]?.settings?.playoff_week_start ?? 15

  if (!bracket) {
    return (
      <div className="gl p-[18px] text-center text-s-text3 text-[12px]">
        No bracket data available for {year}
      </div>
    )
  }

  const champGames = (bracket.winners ?? []).filter(g => !g.p || g.p === 1)
  const winnersRounds = resolveGameResults(champGames, rMap, playoffStart, year, state)
  const rounds = [...winnersRounds.keys()].sort((a, b) => a - b)

  if (rounds.length === 0) {
    return (
      <div className="gl p-[18px] text-center text-s-text3 text-[12px]">
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
    <>
      <div className="gl p-[18px] mt-4 relative overflow-hidden">
        <div className="bento-fill" style={{ background: 'rgba(59,130,246,0.15)' }} />
        <div className="text-[10px] font-bold tracking-[3px] uppercase text-gold-soft mb-1">
          {year} Playoff Bracket
        </div>
        <div className="text-[9px] text-s-text3/50 mb-4">Click any matchup to view game details</div>

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
                    <RoundColumn
                      games={games}
                      onGameClick={result => setSelectedGame({ result, year })}
                    />
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

      {selectedGame && (
        <GameDetailModal detail={selectedGame} onClose={() => setSelectedGame(null)} />
      )}
    </>
  )
}
