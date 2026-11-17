'use client'

import FilterSheet from '@/components/shared/FilterSheet'
import { useState, useMemo } from 'react'
import { DEFAULT_SCORING_VIEW, scoringPositions, scoringRows, type PlayerScoreStat, type ScoringRow, type ScoringSortKey } from '@/lib/data-processing'

import { POS_TEXT_CLASSES as POS_COLORS } from '@/lib/positions'
import PlayerHeadshot from '@/components/shared/PlayerHeadshot'
import SortHeader from '@/components/shared/SortHeader'

const TH_LEFT = 'cursor-pointer select-none text-left'
const TH_RIGHT = 'cursor-pointer select-none text-right'

type SortKey = ScoringSortKey

/** The opening view worked out at build time (app/players/page.tsx), so the table is in the HTML. */
export interface BakedScoring {
  positions: string[]
  top: ScoringRow[]
}

interface Props {
  /** Null until the store and player names load; until then the baked opening view shows */
  playerScores: PlayerScoreStat[] | null
  baked?: BakedScoring | null
  years: number[]
  ownerNames: string[]
}

export default function PlayerScoringTable({ playerScores, baked, years, ownerNames }: Props) {
  const [yearFilter, setYearFilter] = useState<number | 'all'>(DEFAULT_SCORING_VIEW.year)
  const [ownerFilter, setOwnerFilter] = useState<string | 'all'>(DEFAULT_SCORING_VIEW.owner)
  const [posFilter, setPosFilter] = useState<string>(DEFAULT_SCORING_VIEW.pos)
  const [sortKey, setSortKey] = useState<SortKey>(DEFAULT_SCORING_VIEW.sortKey)
  const [sortDir, setSortDir] = useState<1 | -1>(DEFAULT_SCORING_VIEW.sortDir)

  const sortedYears = useMemo(() => [...years].sort((a, b) => b - a), [years])

  function handleSort(k: SortKey) {
    if (sortKey === k) setSortDir(d => (d === 1 ? -1 : 1))
    else { setSortKey(k); setSortDir(-1) }
  }

  // Until the data loads only the opening view is known; any other view waits (null)
  const rows = useMemo<ScoringRow[] | null>(() => {
    const view = { year: yearFilter, owner: ownerFilter, pos: posFilter, sortKey, sortDir }
    if (playerScores) return scoringRows(playerScores, view)
    const opening = (Object.keys(view) as (keyof typeof view)[]).every(k => view[k] === DEFAULT_SCORING_VIEW[k])
    return opening ? baked?.top ?? null : null
  }, [playerScores, baked, yearFilter, ownerFilter, posFilter, sortKey, sortDir])

  const positions = useMemo(
    () => (playerScores ? scoringPositions(playerScores) : baked?.positions ?? ['ALL']),
    [playerScores, baked],
  )

  const sort = { sortKey, sortDir, onSort: handleSort }

  return (
    <div className="gl p-[18px]">
      <div className="text-[10px] font-bold tracking-[2.5px] uppercase text-s-text2 mb-3">
        Top Scorers — Top 25 by total points scored in starts
      </div>

      {/* Filters row */}
      <FilterSheet summary={`${yearFilter === 'all' ? 'All seasons' : yearFilter} · ${ownerFilter === 'all' ? 'All owners' : ownerFilter}`}>
      <div className="flex flex-wrap gap-3 mb-4 items-start">
        {/* Season filter */}
        <div>
          <div className="text-[9px] tracking-[2px] uppercase text-s-text3 mb-1.5">Season</div>
          <div className="flex gap-[5px] flex-wrap">
            <button
              onClick={() => setYearFilter('all')}
              className={[
                'min-h-[32px] sm:min-h-0 px-3 py-[4px] rounded-full border text-[11px] font-semibold cursor-pointer transition-all duration-150',
                yearFilter === 'all'
                  ? 'border-gold text-gold-soft bg-[rgba(201,150,46,0.10)]'
                  : 'bg-s-bg3 border-s-border text-s-text3 hover:border-s-border2 hover:text-s-text2',
              ].join(' ')}
            >
              All
            </button>
            {sortedYears.map(y => (
              <button
                key={y}
                onClick={() => setYearFilter(y)}
                className={[
                  'min-h-[32px] sm:min-h-0 px-3 py-[4px] rounded-full border text-[11px] font-semibold cursor-pointer transition-all duration-150',
                  yearFilter === y
                    ? 'border-gold text-gold-soft bg-[rgba(201,150,46,0.10)]'
                    : 'bg-s-bg3 border-s-border text-s-text3 hover:border-s-border2 hover:text-s-text2',
                ].join(' ')}
              >
                {y}
              </button>
            ))}
          </div>
        </div>

        {/* Owner filter */}
        <div>
          <div className="text-[9px] tracking-[2px] uppercase text-s-text3 mb-1.5">Owner</div>
          <div className="flex gap-[5px] flex-wrap">
            <button
              onClick={() => setOwnerFilter('all')}
              className={[
                'min-h-[32px] sm:min-h-0 px-3 py-[4px] rounded-full border text-[11px] font-semibold cursor-pointer transition-all duration-150',
                ownerFilter === 'all'
                  ? 'border-gold text-gold-soft bg-[rgba(201,150,46,0.10)]'
                  : 'bg-s-bg3 border-s-border text-s-text3 hover:border-s-border2 hover:text-s-text2',
              ].join(' ')}
            >
              All
            </button>
            {ownerNames.map(name => (
              <button
                key={name}
                onClick={() => setOwnerFilter(name)}
                className={[
                  'min-h-[32px] sm:min-h-0 px-3 py-[4px] rounded-full border text-[11px] font-semibold cursor-pointer transition-all duration-150',
                  ownerFilter === name
                    ? 'border-gold text-gold-soft bg-[rgba(201,150,46,0.10)]'
                    : 'bg-s-bg3 border-s-border text-s-text3 hover:border-s-border2 hover:text-s-text2',
                ].join(' ')}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>
      </FilterSheet>

      {/* Position filter */}
      <div className="flex gap-[6px] flex-wrap mb-4">
        {positions.map(pos => (
          <button
            key={pos}
            onClick={() => setPosFilter(pos)}
            className={[
              'min-h-[32px] sm:min-h-0 px-3 py-[4px] rounded-full border text-[11px] font-semibold cursor-pointer transition-all duration-150',
              posFilter === pos
                ? 'bg-[rgba(201,150,46,0.10)] border-s-gold/60 text-s-gold'
                : 'bg-s-bg3 border-s-border text-s-text3 hover:border-s-border2 hover:text-s-text2',
            ].join(' ')}
          >
            {pos}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[12px] min-w-[480px]">
          <thead>
            <tr className="text-[10px] font-bold tracking-[1px] uppercase text-s-text3 border-b border-s-border">
              <th className="text-left w-8">#</th>
              <SortHeader {...sort} k="name" label="Player" className={TH_LEFT} />
              <SortHeader {...sort} k="position" label="Pos" className={TH_LEFT} />
              <SortHeader {...sort} k="totalPoints" label="Total Pts" className={TH_RIGHT} />
              <SortHeader {...sort} k="games" label="G" className={TH_RIGHT} />
              <SortHeader {...sort} k="avgPPG" label="Avg PPG" className={TH_RIGHT} />
            </tr>
          </thead>
          <tbody>
            {rows?.map((r, i) => {
              const posColor = POS_COLORS[r.position] ?? 'text-s-text3'
              return (
                <tr
                  key={r.player_id}
                  className="border-b border-s-bg3 hover:bg-s-bg3 transition-colors"
                >
                  <td className="py-[7px] pr-2 text-s-text3 text-[11px]">{i + 1}</td>
                  <td className="py-[7px] pr-3 font-semibold text-s-text">
                    <div className="flex items-center gap-2">
                      <PlayerHeadshot playerId={r.player_id} position={r.position} size={22} />
                      <span>{r.name}</span>
                    </div>
                  </td>
                  <td className={`py-[7px] pr-3 font-bold text-[11px] ${posColor}`}>{r.position}</td>
                  <td className="py-[7px] pr-3 text-right font-bold text-s-gold tabular-nums">
                    {r.totalPoints.toFixed(2)}
                  </td>
                  <td className="py-[7px] pr-3 text-right text-s-text2 tabular-nums">{r.games}</td>
                  <td className="py-[7px] text-right text-s-text2 tabular-nums">
                    {r.avgPPG.toFixed(2)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {rows?.length === 0 && (
          <div className="text-center py-8 text-s-text3 text-[12px]">No scoring data for this filter</div>
        )}
        {!rows && <div className="text-center py-8 text-s-text3 text-[12px]">Loading scoring data…</div>}
      </div>
    </div>
  )
}
