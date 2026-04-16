'use client'

import { useState } from 'react'
import { Matchup } from '@/types'
import H2HModal from './H2HModal'

interface Props {
  ownerName: string
  allMatchups: Matchup[]
  allOwnerNames: string[]
}

export default function H2HGrid({ ownerName, allMatchups, allOwnerNames }: Props) {
  const [modal, setModal] = useState<{ opp: string; games: Matchup[] } | null>(null)

  const h2hData = allOwnerNames
    .filter(n => n !== ownerName)
    .map(opp => {
      const games = allMatchups.filter(
        g => (g.team1 === ownerName && g.team2 === opp) || (g.team1 === opp && g.team2 === ownerName)
      )
      if (!games.length) return null

      let w = 0, pfTotal = 0, paTotal = 0
      games.forEach(g => {
        const myPts = g.team1 === ownerName ? g.pts1 : g.pts2
        const oppPts = g.team1 === ownerName ? g.pts2 : g.pts1
        pfTotal += myPts
        paTotal += oppPts
        if (myPts >= oppPts) w++
      })
      const l = games.length - w
      return { opp, games, w, l, pfAvg: pfTotal / games.length, paAvg: paTotal / games.length }
    })
    .filter(Boolean) as { opp: string; games: Matchup[]; w: number; l: number; pfAvg: number; paAvg: number }[]

  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-2">
        {h2hData.map(({ opp, games, w, l, pfAvg, paAvg }) => {
          const recCls = w > l ? 'text-s-green' : w < l ? 'text-s-red' : 'text-s-gold'
          return (
            <div
              key={opp}
              onClick={() => setModal({ opp, games })}
              className="bg-s-bg3 border border-s-border rounded-[8px] p-3 cursor-pointer transition-all duration-150 hover:border-s-blue"
            >
              <div className="text-[11px] font-semibold text-s-text2 mb-1">
                vs {opp}
              </div>
              <div className={`text-[22px] font-extrabold leading-none ${recCls}`}>{w}-{l}</div>
              <div className="text-[10px] text-s-text3 mt-1">
                PF: {pfAvg.toFixed(1)} · PA: {paAvg.toFixed(1)}
              </div>
              <div className="text-[10px] text-s-text3">{games.length} game{games.length !== 1 ? 's' : ''}</div>
            </div>
          )
        })}
      </div>

      {modal && (
        <H2HModal
          p1={ownerName}
          p2={modal.opp}
          games={modal.games}
          onClose={() => setModal(null)}
        />
      )}
    </>
  )
}
