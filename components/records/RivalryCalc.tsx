'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useLeague } from '@/context/LeagueContext'
import { USER_ID_TO_OWNER } from '@/lib/constants'
import OwnerAvatar from '@/components/shared/OwnerAvatar'

export default function RivalryCalc() {
  const { state } = useLeague()
  const { allMatchups, ownerSeasons } = state
  const router = useRouter()

  const [ownerA, setOwnerA] = useState('')
  const [ownerB, setOwnerB] = useState('')

  const ownerNames = useMemo(() => {
    return [...new Set(Object.values(USER_ID_TO_OWNER))]
      .filter(n => ownerSeasons[n])
      .sort()
  }, [ownerSeasons])

  const h2h = useMemo(() => {
    if (!ownerA || !ownerB) return null

    const games = [...allMatchups]
      .filter(g =>
        (g.team1 === ownerA && g.team2 === ownerB) ||
        (g.team1 === ownerB && g.team2 === ownerA)
      )
      .sort((a, b) => b.year - a.year || b.week - a.week)

    if (!games.length) return { games, winsA: 0, winsB: 0, avgA: 0, avgB: 0, highA: 0, highB: 0, lastGame: null }

    const winsA = games.filter(g =>
      (g.team1 === ownerA && g.pts1 >= g.pts2) ||
      (g.team2 === ownerA && g.pts2 >= g.pts1)
    ).length
    const winsB = games.length - winsA

    const ptsA = games.map(g => g.team1 === ownerA ? g.pts1 : g.pts2)
    const ptsB = games.map(g => g.team1 === ownerB ? g.pts1 : g.pts2)
    const avgA = ptsA.reduce((a, b) => a + b, 0) / games.length
    const avgB = ptsB.reduce((a, b) => a + b, 0) / games.length
    const highA = Math.max(...ptsA)
    const highB = Math.max(...ptsB)

    return { games, winsA, winsB, avgA, avgB, highA, highB, lastGame: games[0] }
  }, [allMatchups, ownerA, ownerB])

  const selectCls = 'flex-1 min-w-[140px] bg-s-bg3 border border-s-border text-s-text text-[13px] rounded-[8px] px-3 py-2 outline-none focus:border-s-border2 transition-colors'

  return (
    <div className="gl p-[18px] animate-fade-in">
      <div className="text-[10px] font-bold tracking-[2.5px] uppercase text-s-text3 mb-4">
        Rivalry Calculator
      </div>

      {/* Pickers */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <select value={ownerA} onChange={e => setOwnerA(e.target.value)} className={selectCls}>
          <option value="">Select Manager A</option>
          {ownerNames.filter(n => n !== ownerB).map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <span className="text-s-text3 font-bold text-[13px]">vs</span>
        <select value={ownerB} onChange={e => setOwnerB(e.target.value)} className={selectCls}>
          <option value="">Select Manager B</option>
          {ownerNames.filter(n => n !== ownerA).map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      {/* Placeholder */}
      {(!ownerA || !ownerB) && (
        <div className="text-center py-8 text-s-text3 text-[12px]">
          Select two managers above to reveal their all-time head-to-head history
        </div>
      )}

      {/* No games */}
      {h2h && h2h.games.length === 0 && ownerA && ownerB && (
        <div className="text-center py-8 text-s-text3 text-[12px]">
          No recorded matchups between {ownerA} and {ownerB}
        </div>
      )}

      {/* Results */}
      {h2h && h2h.games.length > 0 && (
        <div>
          {/* H2H Record scoreboard */}
          <div className="flex items-center justify-between gap-4 mb-5 px-4 py-4 bg-s-bg3 rounded-[12px]">
            <div
              className="text-center cursor-pointer group flex-1"
              onClick={() => router.push(`/owners/${encodeURIComponent(ownerA)}`)}
            >
              <div className="flex items-center gap-2 justify-center mb-2">
                <OwnerAvatar name={ownerA} size="sm" />
                <span className="text-[13px] font-bold text-s-text group-hover:underline">{ownerA}</span>
              </div>
              <div className={`text-[36px] font-black num leading-none ${h2h.winsA >= h2h.winsB ? 'text-s-green' : 'text-s-text3'}`}>
                {h2h.winsA}
              </div>
              <div className="text-[10px] text-s-text3 mt-1">wins</div>
            </div>

            <div className="text-center flex-shrink-0">
              <div className="text-[11px] font-bold text-s-text3 uppercase tracking-[1px]">
                {h2h.games.length} games
              </div>
              <div className="text-[20px] text-s-text3 mt-1">⚔️</div>
            </div>

            <div
              className="text-center cursor-pointer group flex-1"
              onClick={() => router.push(`/owners/${encodeURIComponent(ownerB)}`)}
            >
              <div className="flex items-center gap-2 justify-center mb-2">
                <OwnerAvatar name={ownerB} size="sm" />
                <span className="text-[13px] font-bold text-s-text group-hover:underline">{ownerB}</span>
              </div>
              <div className={`text-[36px] font-black num leading-none ${h2h.winsB >= h2h.winsA ? 'text-s-green' : 'text-s-text3'}`}>
                {h2h.winsB}
              </div>
              <div className="text-[10px] text-s-text3 mt-1">wins</div>
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-s-bg3 rounded-[10px] p-3 text-center">
              <div className="text-[9px] text-s-text3 uppercase tracking-[1.5px] mb-2">Avg Score</div>
              <div className="flex items-end justify-center gap-3">
                <div>
                  <div className="text-[20px] font-extrabold text-s-text num">{h2h.avgA.toFixed(1)}</div>
                  <div className="text-[10px] text-s-text3">{ownerA}</div>
                </div>
                <div className="text-s-text3 text-[11px] mb-[22px]">vs</div>
                <div>
                  <div className="text-[20px] font-extrabold text-s-text num">{h2h.avgB.toFixed(1)}</div>
                  <div className="text-[10px] text-s-text3">{ownerB}</div>
                </div>
              </div>
            </div>
            <div className="bg-s-bg3 rounded-[10px] p-3 text-center">
              <div className="text-[9px] text-s-text3 uppercase tracking-[1.5px] mb-2">Highest Score</div>
              <div className="flex items-end justify-center gap-3">
                <div>
                  <div className="text-[20px] font-extrabold text-s-gold num">{h2h.highA?.toFixed(1)}</div>
                  <div className="text-[10px] text-s-text3">{ownerA}</div>
                </div>
                <div className="text-s-text3 text-[11px] mb-[22px]">vs</div>
                <div>
                  <div className="text-[20px] font-extrabold text-s-gold num">{h2h.highB?.toFixed(1)}</div>
                  <div className="text-[10px] text-s-text3">{ownerB}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Most recent matchup */}
          {h2h.lastGame && (() => {
            const g = h2h.lastGame
            const aIsT1 = g.team1 === ownerA
            const ptsA = aIsT1 ? g.pts1 : g.pts2
            const ptsB = aIsT1 ? g.pts2 : g.pts1
            const aWon = ptsA >= ptsB
            return (
              <div className="bg-s-bg3 rounded-[10px] p-3 mb-3">
                <div className="text-[9px] text-s-text3 uppercase tracking-[1.5px] mb-3">Most Recent Matchup</div>
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <div className="text-[12px] font-bold text-s-text mb-1">{ownerA}</div>
                    <div className={`text-[26px] font-black num ${aWon ? 'text-s-green' : 'text-s-red'}`}>{ptsA.toFixed(1)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] text-s-text3">{g.year} · Wk{g.week}</div>
                    <div className="text-[10px] font-bold text-s-text3 mt-1">
                      {g.type === 'P' ? '🏆 Playoff' : 'Regular Season'}
                    </div>
                    <div className="text-[11px] font-bold text-s-text3 mt-2">vs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[12px] font-bold text-s-text mb-1">{ownerB}</div>
                    <div className={`text-[26px] font-black num ${!aWon ? 'text-s-green' : 'text-s-red'}`}>{ptsB.toFixed(1)}</div>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Game log */}
          <div className="max-h-[220px] overflow-y-auto">
            <div className="text-[9px] text-s-text3 uppercase tracking-[1.5px] mb-2">All Matchups</div>
            {h2h.games.map(g => {
              const aIsT1 = g.team1 === ownerA
              const ptsA = aIsT1 ? g.pts1 : g.pts2
              const ptsB = aIsT1 ? g.pts2 : g.pts1
              const aWon = ptsA >= ptsB
              const margin = Math.abs(ptsA - ptsB)
              return (
                <div key={`${g.year}-${g.week}`} className="flex items-center gap-2 py-[7px] border-b border-s-bg3 text-[11px] hover:bg-s-bg3 px-1 rounded transition-colors">
                  <span className="text-s-text3 w-[62px] flex-shrink-0 num">{g.year} Wk{g.week}</span>
                  <span className={`font-bold num w-[46px] ${aWon ? 'text-s-green' : 'text-s-text3'}`}>{ptsA.toFixed(1)}</span>
                  <span className="text-s-text3">–</span>
                  <span className={`font-bold num w-[46px] ${!aWon ? 'text-s-green' : 'text-s-text3'}`}>{ptsB.toFixed(1)}</span>
                  <span className={`ml-auto px-[6px] py-[1px] rounded text-[9px] font-extrabold flex-shrink-0 ${aWon ? 'bg-[#052e16] text-s-green' : 'bg-[#450a0a] text-s-red'}`}>
                    {aWon ? ownerA : ownerB} W
                  </span>
                  <span className="text-s-text3 text-[9px] num">+{margin.toFixed(1)}</span>
                  <span className="text-[9px] text-s-text3 flex-shrink-0">{g.type === 'P' ? 'PLY' : 'REG'}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
