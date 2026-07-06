'use client'

import { useState } from 'react'
import { Matchup } from '@/types'
import { h2hVsAll } from '@/lib/stats'
import H2HModal from './H2HModal'

interface Props {
  ownerName: string
  allMatchups: Matchup[]
  allOwnerNames: string[]
}

export default function H2HGrid({ ownerName, allMatchups, allOwnerNames }: Props) {
  const [modal, setModal] = useState<{ opp: string; games: Matchup[] } | null>(null)

  const h2hData = h2hVsAll(allMatchups, ownerName, allOwnerNames)

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
