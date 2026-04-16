'use client'

import { useLeague } from '@/context/LeagueContext'
import type { BracketGame } from '@/types'

interface MatchupResult {
  t1Name: string
  t2Name: string
  t1Score: number | null
  t2Score: number | null
  winnerName: string | null
  label: string | null
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
  // group by round
  const byRound = new Map<number, MatchupResult[]>()
  for (const g of games) {
    if (g.t1 == null && g.t2 == null) continue
    const t1Id = g.t1 ?? g.w ?? null
    const t2Id = g.t2 ?? g.l ?? null
    if (t1Id == null || t2Id == null) continue

    const week = playoffStart + (g.r - 1)
    const t1Name = rMap[String(t1Id)] ?? `Team${t1Id}`
    const t2Name = rMap[String(t2Id)] ?? `Team${t2Id}`
    const t1Score = resolveScore(t1Id, week, year, state)
    const t2Score = resolveScore(t2Id, week, year, state)
    const winnerName = g.w != null ? (rMap[String(g.w)] ?? `Team${g.w}`) : null

    let label: string | null = null
    if (g.p === 1) label = '🏆 Championship'
    else if (g.p === 3) label = '3rd Place'
    else if (g.p === 5) label = '5th Place'

    const round = byRound.get(g.r) ?? []
    round.push({ t1Name, t2Name, t1Score, t2Score, winnerName, label })
    byRound.set(g.r, round)
  }
  return byRound
}

function MatchupCard({ result }: { result: MatchupResult }) {
  const { t1Name, t2Name, t1Score, t2Score, winnerName, label } = result
  const t1Won = winnerName === t1Name
  const t2Won = winnerName === t2Name

  return (
    <div className="bg-[#1e1e2e] border border-s-border rounded-[8px] p-[10px] mb-2">
      {label && (
        <div className="text-[9px] font-bold uppercase tracking-[1.5px] text-s-gold mb-[6px]">{label}</div>
      )}
      <div className="flex flex-col gap-[4px]">
        {[
          { name: t1Name, score: t1Score, won: t1Won },
          { name: t2Name, score: t2Score, won: t2Won },
        ].map(({ name, score, won }) => (
          <div key={name} className={`flex items-center justify-between gap-2 px-[8px] py-[5px] rounded-[5px] ${won ? 'bg-[#1a2e1a]' : ''}`}>
            <span className={`text-[12px] font-semibold ${won ? 'text-s-text' : 'text-s-text3'}`}>{name}</span>
            <span className={`font-mono text-[12px] ${won ? 'text-s-green font-bold' : 'text-s-text3'}`}>
              {score != null ? score.toFixed(2) : winnerName != null ? '—' : 'TBD'}
            </span>
          </div>
        ))}
      </div>
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

  const winnersRounds = resolveGameResults(bracket.winners ?? [], rMap, playoffStart, year, state)
  const losersRounds  = resolveGameResults(bracket.losers  ?? [], rMap, playoffStart, year, state)

  const maxWinnersRound = Math.max(0, ...[...winnersRounds.keys()])

  function winnersLabel(r: number): string {
    if (r === 1 && maxWinnersRound > 2) return `Wk ${playoffStart} — Quarterfinals`
    if (r === maxWinnersRound - 1) return `Wk ${playoffStart + r - 1} — Semifinals`
    if (r === maxWinnersRound) return `Wk ${playoffStart + r - 1} — Finals`
    return `Wk ${playoffStart + r - 1} — Round ${r}`
  }

  function losersLabel(r: number): string {
    const maxR = Math.max(0, ...[...losersRounds.keys()])
    if (r === maxR) return `Wk ${playoffStart + r - 1} — Toilet Bowl`
    return `Wk ${playoffStart + r - 1} — Round ${r}`
  }

  return (
    <div className="rounded-[12px] bg-[#252535] p-[18px] mt-4">
      <div className="text-[10px] font-bold tracking-[3px] uppercase text-s-text3 mb-4">
        {year} Playoff Brackets
      </div>

      {winnersRounds.size > 0 && (
        <div className="mb-6 overflow-x-auto">
          <div className="min-w-[480px]">
            <div className="text-[10px] font-bold tracking-[2px] uppercase text-s-gold mb-3">🏆 Championship Bracket</div>
            <div className="grid gap-[14px]" style={{ gridTemplateColumns: `repeat(${winnersRounds.size}, 1fr)` }}>
              {[...winnersRounds.keys()].sort((a, b) => a - b).map(r => (
                <div key={r}>
                  <div className="text-[9px] text-s-text3 uppercase tracking-[1px] mb-2">{winnersLabel(r)}</div>
                  {(winnersRounds.get(r) ?? []).map((result, i) => (
                    <MatchupCard key={i} result={result} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {losersRounds.size > 0 && (
        <div className="overflow-x-auto">
          <div className="min-w-[480px]">
            <div className="text-[10px] font-bold tracking-[2px] uppercase text-s-red mb-3">🚽 Toilet Bowl Bracket</div>
            <div className="grid gap-[14px]" style={{ gridTemplateColumns: `repeat(${losersRounds.size}, 1fr)` }}>
              {[...losersRounds.keys()].sort((a, b) => a - b).map(r => (
                <div key={r}>
                  <div className="text-[9px] text-s-text3 uppercase tracking-[1px] mb-2">{losersLabel(r)}</div>
                  {(losersRounds.get(r) ?? []).map((result, i) => (
                    <MatchupCard key={i} result={result} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
