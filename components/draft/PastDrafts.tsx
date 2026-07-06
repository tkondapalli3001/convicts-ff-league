'use client'

import { useState } from 'react'
import { useLeague } from '@/context/LeagueContext'
import DraftBoardModal from './DraftBoardModal'

export default function PastDrafts() {
  const { state } = useLeague()
  const { draftData, rosterUserMaps, years } = state
  const [modalYear, setModalYear] = useState<number | null>(null)

  const sortedYears = [...years].sort((a, b) => b - a)

  if (!Object.keys(draftData).length) {
    return (
      <div className="gl p-6 text-center text-s-text3 text-[12px]">
        No draft history available
      </div>
    )
  }

  const modalData = modalYear !== null ? draftData[modalYear] : null

  return (
    <>
      <div className="space-y-2">
        {sortedYears.map(year => {
          const data = draftData[year]
          if (!data) return null
          const { draft, picks } = data
          const roundCount = Math.max(...picks.map(p => p.round), 0)

          return (
            <div key={year} className="bento-card overflow-hidden">
              <button
                onClick={() => setModalYear(year)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-s-bg3/30 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[14px] font-extrabold text-s-text">{year}</span>
                  <span className="text-[10px] font-bold tracking-[1.5px] uppercase text-s-text3 bg-s-bg3 px-2 py-0.5 rounded-full border border-s-border">
                    {draft.type.toUpperCase()}
                  </span>
                  <span className="text-[11px] text-s-text3">
                    {picks.length} picks · {roundCount} rounds
                  </span>
                </div>
                <span className="text-[12px] text-s-text3 flex items-center gap-1.5 font-semibold">
                  View Board
                  <span className="text-[14px]">→</span>
                </span>
              </button>
            </div>
          )
        })}
      </div>

      {modalYear !== null && modalData && (
        <DraftBoardModal
          year={modalYear}
          draft={modalData.draft}
          picks={modalData.picks}
          rMap={rosterUserMaps[modalYear] ?? {}}
          onClose={() => setModalYear(null)}
        />
      )}
    </>
  )
}
