'use client'

import { useState, useMemo } from 'react'
import type { OwnershipEntry } from '@/lib/data-processing'
import { USER_ID_TO_OWNER } from '@/lib/constants'

import { POS_TEXT_CLASSES as POS_COLORS } from '@/lib/constants'
import PlayerHeadshot from '@/components/shared/PlayerHeadshot'

const FLEX_POSITIONS = new Set(['RB', 'WR', 'TE'])

type SortKey = 'name' | 'position' | 'timesOwned' | 'avgPickNo'

interface Props {
  ownership: OwnershipEntry[]
}

export default function PlayerOwnershipTable({ ownership }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('timesOwned')
  const [sortDir, setSortDir] = useState<1 | -1>(-1)
  const [ownerFilter, setOwnerFilter] = useState<string>('ALL')
  const [posFilter, setPosFilter] = useState<string>('ALL')

  const owners = useMemo(() => {
    const unique = [...new Set([...new Set(Object.values(USER_ID_TO_OWNER))].sort())]
    return ['ALL', ...unique]
  }, [])

  const positions = useMemo(() => {
    const set = new Set(ownership.map(e => e.position).filter(Boolean))
    return ['ALL', 'QB', 'RB', 'WR', 'TE', 'FLEX', 'K', 'DEF'].filter(p => p === 'ALL' || p === 'FLEX' || set.has(p))
  }, [ownership])

  function handleSort(k: SortKey) {
    if (sortKey === k) setSortDir(d => d === 1 ? -1 : 1)
    else { setSortKey(k); setSortDir(-1) }
  }

  // When an owner is selected, timesOwned reflects that owner's pick count so
  // sorting by timesOwned naturally surfaces their most-drafted players.
  const enriched = useMemo(() => {
    return ownership.map(e => {
      const byOwner = e.picks.reduce<Record<string, number>>((acc, p) => {
        acc[p.owner] = (acc[p.owner] ?? 0) + 1
        return acc
      }, {})
      return {
        ...e,
        timesOwned: ownerFilter !== 'ALL' ? (byOwner[ownerFilter] ?? 0) : e.picks.length,
        byOwner,
      }
    })
  }, [ownership, ownerFilter])

  const filtered = useMemo(() => {
    return enriched
      .filter(e => {
        if (posFilter === 'FLEX') { if (!FLEX_POSITIONS.has(e.position)) return false }
        else if (posFilter !== 'ALL' && e.position !== posFilter) return false
        if (ownerFilter !== 'ALL' && !e.byOwner[ownerFilter]) return false
        return true
      })
      .sort((a, b) => {
        const getVal = (item: typeof enriched[0]): string | number => {
          switch (sortKey) {
            case 'name': return item.name
            case 'position': return item.position
            case 'timesOwned': return item.timesOwned
            case 'avgPickNo': return item.avgPickNo
          }
        }
        const av = getVal(a)
        const bv = getVal(b)
        if (typeof av === 'string') return av.localeCompare(bv as string) * sortDir
        return ((av as number) - (bv as number)) * sortDir
      })
  }, [enriched, posFilter, ownerFilter, sortKey, sortDir])

  const SortTh = ({ k, label, right }: { k: SortKey; label: string; right?: boolean }) => (
    <th
      onClick={() => handleSort(k)}
      className={`cursor-pointer select-none ${right ? 'text-right' : 'text-left'}`}
      style={{ color: sortKey === k ? '#C9A24B' : undefined }}
    >
      {label} {sortKey === k ? (sortDir === 1 ? '↑' : '↓') : ''}
    </th>
  )

  return (
    <div className="bg-s-bg2 border border-s-border rounded-[12px] p-[18px]">
      <div className="text-[10px] font-bold tracking-[2.5px] uppercase text-s-text2 mb-3">
        Draft Ownership — most-drafted players across all seasons
      </div>

      {/* Position filter */}
      <div className="flex gap-[6px] flex-wrap mb-2">
        {positions.map(pos => (
          <button
            key={pos}
            onClick={() => setPosFilter(pos)}
            className={[
              'px-3 py-[4px] rounded-full border text-[11px] font-semibold cursor-pointer transition-all duration-150',
              posFilter === pos
                ? 'border-gold text-gold-soft bg-[rgba(201,150,46,0.10)]'
                : 'bg-s-bg3 border-s-border text-s-text3 hover:border-s-border2 hover:text-s-text2',
            ].join(' ')}
          >
            {pos}
          </button>
        ))}
      </div>

      {/* Owner filter */}
      <div className="flex gap-[6px] flex-wrap mb-4">
        {owners.map(owner => (
          <button
            key={owner}
            onClick={() => setOwnerFilter(owner)}
            className={[
              'px-3 py-[4px] rounded-full border text-[11px] font-semibold cursor-pointer transition-all duration-150',
              ownerFilter === owner
                ? 'bg-[#1a3020] border-s-green text-[#86efac]'
                : 'bg-s-bg3 border-s-border text-s-text3 hover:border-s-border2 hover:text-s-text2',
            ].join(' ')}
          >
            {owner}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[12px] min-w-[520px]">
          <thead>
            <tr className="text-[10px] font-bold tracking-[1px] uppercase text-s-text3 border-b border-s-border">
              <SortTh k="name" label="Player" />
              <SortTh k="position" label="Pos" />
              <SortTh k="timesOwned" label={ownerFilter === 'ALL' ? 'Times Drafted' : `By ${ownerFilter}`} right />
              <SortTh k="avgPickNo" label="Avg Pick" right />
              <th className="text-left">Managers (seasons)</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 25).map(e => {
              const posColor = POS_COLORS[e.position] ?? 'text-s-text3'
              const ownersSummary = Object.entries(e.byOwner)
                .sort((a, b) => b[1] - a[1])
                .map(([o, c]) => c > 1 ? `${o} (${c}×)` : o)
                .join(', ')
              return (
                <tr key={e.player_id} className="border-b border-s-bg3 hover:bg-s-bg3 transition-colors">
                  <td className="py-[7px] pr-3 font-semibold text-s-text">
                    <div className="flex items-center gap-2">
                      <PlayerHeadshot playerId={e.player_id} position={e.position} size={22} />
                      <span>{e.name}</span>
                    </div>
                  </td>
                  <td className={`py-[7px] pr-3 font-bold text-[11px] ${posColor}`}>{e.position}</td>
                  <td className="py-[7px] pr-3 text-right font-bold text-s-text">{e.timesOwned}</td>
                  <td className="py-[7px] pr-3 text-right text-s-text2 font-mono">#{e.avgPickNo.toFixed(1)}</td>
                  <td className="py-[7px] text-s-text3 text-[11px]">{ownersSummary}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-8 text-s-text3 text-[12px]">No players match this filter</div>
        )}
      </div>
    </div>
  )
}
