'use client'

import { useState } from 'react'
import { Matchup } from '@/types'
import { h2hVsAll } from '@/lib/stats'
import { winPctColor } from '@/lib/utils'
import OwnerAvatar from '@/components/shared/OwnerAvatar'
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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {h2hData.map(({ opp, games, w, l, pfAvg, paAvg }) => {
          const pct = w / (w + l || 1)
          return (
            <button
              key={opp}
              onClick={() => setModal({ opp, games })}
              className="rounded-[6px] border p-3.5 text-left transition-colors hover:bg-[rgba(201,150,46,0.05)]"
              style={{ background: '#0B0B0D', borderColor: 'rgba(var(--gold-rgb), 0.12)' }}
            >
              <div className="mb-2 flex items-center gap-2">
                <OwnerAvatar name={opp} size="sm" />
                <span className="truncate text-[11px] font-semibold text-s-text2">vs {opp}</span>
              </div>
              <div className="font-display text-[26px] font-bold leading-none" style={{ color: winPctColor(pct) }}>
                {w}–{l}
              </div>
              <div className="mt-1.5 text-[10px] uppercase tracking-[0.5px] text-s-text3">
                {(pct * 100).toFixed(0)}% · {games.length} game{games.length !== 1 ? 's' : ''}
              </div>
              <div className="mt-0.5 text-[10px] text-s-text3 num">
                PF {pfAvg.toFixed(1)} · PA {paAvg.toFixed(1)}
              </div>
            </button>
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
