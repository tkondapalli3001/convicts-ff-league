'use client'

import { useState, useMemo, Fragment } from 'react'
import { useLeague } from '@/context/LeagueContext'
import { buildDraftSlotRows } from '@/lib/data-processing'

function ordinal(n: number) {
  if (n === 1) return 'st'
  if (n === 2) return 'nd'
  if (n === 3) return 'rd'
  return 'th'
}

export default function DraftSlotAnalysis() {
  const { state } = useLeague()
  const { draftData, rosterUserMaps, ownerSeasons, years } = state
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null)
  const [selectedManager, setSelectedManager] = useState<string | null>(null)
  const [slotSort, setSlotSort] = useState<'slot' | 'avgFinish' | 'playoffs'>('slot')
  const [slotSortDir, setSlotSortDir] = useState<'asc' | 'desc'>('asc')
  const [mgrSort, setMgrSort] = useState<'owner' | 'avgSlot' | 'count'>('avgSlot')
  const [mgrSortDir, setMgrSortDir] = useState<'asc' | 'desc'>('asc')

  const rows = useMemo(
    () => buildDraftSlotRows({ draftData, rosterUserMaps, ownerSeasons, years }),
    [draftData, rosterUserMaps, ownerSeasons, years]
  )

  const avgBySlot = useMemo(() => {
    const acc: Record<number, { finishes: number[]; playoffs: number; total: number }> = {}
    for (const row of rows) {
      if (!acc[row.slot]) acc[row.slot] = { finishes: [], playoffs: 0, total: 0 }
      if (row.finish !== null) acc[row.slot].finishes.push(row.finish)
      acc[row.slot].total++
      if (row.madePlayoffs) acc[row.slot].playoffs++
    }
    return acc
  }, [rows])

  const managerAvgSlot = useMemo(() => {
    const totals: Record<string, { sum: number; count: number }> = {}
    for (const row of rows) {
      if (!totals[row.owner]) totals[row.owner] = { sum: 0, count: 0 }
      totals[row.owner].sum += row.slot
      totals[row.owner].count += 1
    }
    return Object.entries(totals)
      .map(([owner, { sum, count }]) => ({ owner, avgSlot: sum / count, count }))
      .sort((a, b) => a.avgSlot - b.avgSlot)
  }, [rows])

  if (!rows.length) {
    return (
      <div className="gl p-6 text-center text-s-text3 text-[12px]">
        No draft slot data available yet
      </div>
    )
  }

  function toggleSlotSort(key: 'slot' | 'avgFinish' | 'playoffs') {
    if (slotSort === key) setSlotSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSlotSort(key); setSlotSortDir('asc') }
  }
  function toggleMgrSort(key: 'owner' | 'avgSlot' | 'count') {
    if (mgrSort === key) setMgrSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setMgrSort(key); setMgrSortDir('asc') }
  }
  const sIcon = (key: 'slot' | 'avgFinish' | 'playoffs') =>
    slotSort === key ? (slotSortDir === 'asc' ? ' ↑' : ' ↓') : ''
  const mIcon = (key: 'owner' | 'avgSlot' | 'count') =>
    mgrSort === key ? (mgrSortDir === 'asc' ? ' ↑' : ' ↓') : ''

  const sortedSlots = [...new Set(rows.map(r => r.slot))].sort((a, b) => {
    if (slotSort === 'slot') return slotSortDir === 'asc' ? a - b : b - a
    if (slotSort === 'avgFinish') {
      const da = avgBySlot[a], db = avgBySlot[b]
      const avgA = da?.finishes.length ? da.finishes.reduce((x, y) => x + y, 0) / da.finishes.length : (slotSortDir === 'asc' ? Infinity : -Infinity)
      const avgB = db?.finishes.length ? db.finishes.reduce((x, y) => x + y, 0) / db.finishes.length : (slotSortDir === 'asc' ? Infinity : -Infinity)
      return slotSortDir === 'asc' ? avgA - avgB : avgB - avgA
    }
    const da = avgBySlot[a], db = avgBySlot[b]
    const pctA = da?.total ? da.playoffs / da.total : 0
    const pctB = db?.total ? db.playoffs / db.total : 0
    return slotSortDir === 'asc' ? pctA - pctB : pctB - pctA
  })

  const sortedManagers = [...managerAvgSlot].sort((a, b) => {
    if (mgrSort === 'owner') return mgrSortDir === 'asc' ? a.owner.localeCompare(b.owner) : b.owner.localeCompare(a.owner)
    if (mgrSort === 'count') return mgrSortDir === 'asc' ? a.count - b.count : b.count - a.count
    return mgrSortDir === 'asc' ? a.avgSlot - b.avgSlot : b.avgSlot - a.avgSlot
  })

  return (
    <div className="space-y-3">
      <div className="gl overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th onClick={() => toggleSlotSort('slot')} className="text-left px-4 py-3 text-[10px] font-bold tracking-[2px] uppercase text-s-text3 border-b border-s-border cursor-pointer select-none hover:text-s-text2">Slot{sIcon('slot')}</th>
              <th onClick={() => toggleSlotSort('avgFinish')} className="text-center px-3 py-3 text-[10px] font-bold tracking-[2px] uppercase text-s-text3 border-b border-s-border cursor-pointer select-none hover:text-s-text2">Avg Finish{sIcon('avgFinish')}</th>
              <th onClick={() => toggleSlotSort('playoffs')} className="text-center px-3 py-3 text-[10px] font-bold tracking-[2px] uppercase text-s-text3 border-b border-s-border cursor-pointer select-none hover:text-s-text2">Made Playoffs{sIcon('playoffs')}</th>
            </tr>
          </thead>
          <tbody>
            {sortedSlots.map(slot => {
              const d = avgBySlot[slot]
              const avg = d?.finishes.length
                ? (d.finishes.reduce((a, b) => a + b, 0) / d.finishes.length)
                : null
              const isOpen = selectedSlot === slot
              const slotRows = rows.filter(r => r.slot === slot)

              return (
                <Fragment key={`slot-${slot}`}>
                  <tr
                    className={`border-b border-s-border/40 cursor-pointer transition-colors ${
                      isOpen ? 'bg-s-bg3/60' : 'hover:bg-s-bg3/30'
                    }`}
                    onClick={() => setSelectedSlot(isOpen ? null : slot)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-extrabold text-s-text">Slot {slot}</span>
                        <span
                          className="text-s-text3 text-[11px] leading-none transition-transform duration-200"
                          style={{ display: 'inline-block', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                        >
                          ▾
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`text-[14px] font-bold ${
                        avg !== null && avg <= 3 ? 'text-s-gold'
                        : avg !== null && avg >= 9 ? 'text-s-red'
                        : 'text-s-text2'
                      }`}>
                        {avg !== null ? avg.toFixed(1) : '—'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center text-[12px] text-s-text2">
                      {d ? `${d.playoffs} / ${d.total}` : '—'}
                    </td>
                  </tr>

                  {isOpen && (
                    <tr>
                      <td colSpan={3} className="px-4 py-0 border-b border-s-border/40 bg-s-bg3/20">
                        <div className="py-3">
                          <div className="text-[10px] font-bold tracking-[2px] uppercase text-s-text3 mb-2">
                            {slotRows.length} manager{slotRows.length !== 1 ? 's' : ''} from Slot {slot} —&nbsp;
                            {d?.playoffs ?? 0} of {d?.total ?? 0} made playoffs
                          </div>
                          <table className="w-full border-collapse text-[12px]">
                            <thead>
                              <tr>
                                <th className="text-left py-1.5 pr-4 text-[9px] text-s-text3 font-semibold uppercase tracking-wider">Year</th>
                                <th className="text-left py-1.5 pr-4 text-[9px] text-s-text3 font-semibold uppercase tracking-wider">Manager</th>
                                <th className="text-center py-1.5 pr-4 text-[9px] text-s-text3 font-semibold uppercase tracking-wider">Finish</th>
                                <th className="text-center py-1.5 text-[9px] text-s-text3 font-semibold uppercase tracking-wider">Playoffs</th>
                              </tr>
                            </thead>
                            <tbody>
                              {slotRows.sort((a, b) => b.year - a.year).map(r => (
                                <tr key={`${r.year}-${r.owner}`}>
                                  <td className="py-1 pr-4 text-s-text3 font-bold">{r.year}</td>
                                  <td className="py-1 pr-4 font-semibold text-s-text">{r.owner}</td>
                                  <td className="py-1 pr-4 text-center font-bold text-s-text2">
                                    {r.finish === null ? '—'
                                      : r.finish === 1 ? '🏆 1st'
                                      : `${r.finish}${ordinal(r.finish)}`}
                                  </td>
                                  <td className="py-1 text-center">
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                      r.madePlayoffs
                                        ? 'bg-[rgba(127,168,134,0.14)] text-win'
                                        : 'bg-[rgba(180,99,107,0.14)] text-loss'
                                    }`}>
                                      {r.madePlayoffs ? 'Yes' : 'No'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Manager avg draft slot table */}
      <div className="gl overflow-hidden">
        <div className="px-4 py-3 border-b border-s-border">
          <span className="text-[12px] font-extrabold tracking-[1.5px] uppercase text-s-text">Avg Draft Slot by Manager</span>
          <span className="text-[11px] text-s-text3 ml-2">· lower = earlier draft slot on average</span>
        </div>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th onClick={() => toggleMgrSort('owner')} className="text-left px-4 py-3 text-[10px] font-bold tracking-[2px] uppercase text-s-text3 border-b border-s-border cursor-pointer select-none hover:text-s-text2">Manager{mIcon('owner')}</th>
              <th onClick={() => toggleMgrSort('avgSlot')} className="text-center px-3 py-3 text-[10px] font-bold tracking-[2px] uppercase text-s-text3 border-b border-s-border cursor-pointer select-none hover:text-s-text2">Avg Slot{mIcon('avgSlot')}</th>
              <th onClick={() => toggleMgrSort('count')} className="text-center px-3 py-3 text-[10px] font-bold tracking-[2px] uppercase text-s-text3 border-b border-s-border cursor-pointer select-none hover:text-s-text2"># Drafts{mIcon('count')}</th>
            </tr>
          </thead>
          <tbody>
            {sortedManagers.map((row, i) => (
              <tr
                key={row.owner}
                className="border-b border-s-border/40 hover:bg-s-bg3/30 transition-colors cursor-pointer"
                onClick={() => setSelectedManager(row.owner)}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-s-text3 w-5 text-right">{i + 1}</span>
                    <span className="text-[13px] font-semibold text-s-text">{row.owner}</span>
                  </div>
                </td>
                <td className="px-3 py-3 text-center">
                  <span className="text-[14px] font-bold text-s-text2 font-mono">{row.avgSlot.toFixed(1)}</span>
                </td>
                <td className="px-3 py-3 text-center text-[13px] text-s-text3">{row.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedManager && (() => {
        const history = rows.filter(r => r.owner === selectedManager).sort((a, b) => b.year - a.year)
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            onClick={() => setSelectedManager(null)}
          >
            <div
              className="bg-s-bg2 border border-s-border rounded-[14px] p-6 max-w-sm w-full mx-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[15px] font-extrabold text-s-text">{selectedManager}</span>
                <button
                  onClick={() => setSelectedManager(null)}
                  className="text-s-text3 hover:text-s-text text-[20px] leading-none"
                >×</button>
              </div>
              <div className="text-[10px] text-s-text3 uppercase tracking-[1.5px] font-bold mb-4">
                {history.length} season{history.length !== 1 ? 's' : ''} · Draft slot history
              </div>
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr>
                    <th className="text-left pb-2 text-[9px] text-s-text3 font-semibold uppercase tracking-wider">Year</th>
                    <th className="text-center pb-2 text-[9px] text-s-text3 font-semibold uppercase tracking-wider">Slot</th>
                    <th className="text-center pb-2 text-[9px] text-s-text3 font-semibold uppercase tracking-wider">Finish</th>
                    <th className="text-center pb-2 text-[9px] text-s-text3 font-semibold uppercase tracking-wider">Playoffs</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(r => (
                    <tr key={r.year} className="border-t border-s-border/30">
                      <td className="py-2 font-bold text-s-text3">{r.year}</td>
                      <td className="py-2 text-center font-mono font-bold text-s-text2">{r.slot}</td>
                      <td className="py-2 text-center font-bold text-s-text2">
                        {r.finish === null ? '—'
                          : r.finish === 1 ? '🏆 1st'
                          : `${r.finish}${ordinal(r.finish)}`}
                      </td>
                      <td className="py-2 text-center">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          r.madePlayoffs
                            ? 'bg-[rgba(127,168,134,0.14)] text-win'
                            : 'bg-[rgba(180,99,107,0.14)] text-loss'
                        }`}>
                          {r.madePlayoffs ? 'Yes' : 'No'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
