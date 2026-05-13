'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useLeague } from '@/context/LeagueContext'
import { usePlayersData } from '@/hooks/usePlayersData'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ErrorState from '@/components/shared/ErrorState'
import StockStandings from '@/components/draft/StockStandings'
import DraftBoardModal from '@/components/draft/DraftBoardModal'
import StealsBusts from '@/components/draft/StealsBusts'
import DraftStructureTable from '@/components/players/DraftStructureTable'
import {
  STOCK_PICKS_2026,
  MARKET_BENCHMARK_2026,
  fetchCurrentPrices,
} from '@/lib/stock-picks'
import { resolveOwnerName } from '@/lib/data-processing'

type Tab = 'pickorder' | 'history' | 'slots' | 'steals' | 'strategy'

const TABS: { id: Tab; label: string }[] = [
  { id: 'pickorder', label: '2026 Pick Order'  },
  { id: 'history',   label: 'Past Drafts'      },
  { id: 'slots',     label: 'Slot Analysis'    },
  { id: 'steals',    label: 'Steals & Busts'   },
  { id: 'strategy',  label: 'Draft Strategy'   },
]

function ordinal(n: number) {
  if (n === 1) return 'st'
  if (n === 2) return 'nd'
  if (n === 3) return 'rd'
  return 'th'
}

// ─── Draft Slot Analysis ──────────────────────────────────────────────────────

function DraftSlotTable() {
  const { state } = useLeague()
  const { draftData, rosterUserMaps, ownerSeasons, years } = state
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null)
  const [selectedManager, setSelectedManager] = useState<string | null>(null)

  const rows = useMemo(() => {
    const out: { year: number; owner: string; slot: number; finish: number | null; madePlayoffs: boolean }[] = []
    for (const year of [...years].sort((a, b) => b - a)) {
      const data = draftData[year]
      if (!data?.picks?.length) continue
      const rMap = rosterUserMaps[year] ?? {}

      const slotMap: Record<number, string> = {}
      for (const pick of data.picks) {
        if (pick.round !== 1) continue
        const ownerName = rMap[String(pick.roster_id)]
          ?? resolveOwnerName(pick.picked_by, '')
        if (ownerName) slotMap[pick.draft_slot] = ownerName
      }

      for (const [slot, owner] of Object.entries(slotMap)) {
        const season = ownerSeasons[owner]?.find(s => s.year === year)
        out.push({
          year,
          owner,
          slot: Number(slot),
          finish: season?.finish ?? null,
          madePlayoffs: season?.inPlayoffs ?? false,
        })
      }
    }
    return out
  }, [draftData, rosterUserMaps, ownerSeasons, years])

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

  const slots = [...new Set(rows.map(r => r.slot))].sort((a, b) => a - b)

  return (
    <div className="space-y-3">
      <div className="gl overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left px-4 py-3 text-[10px] font-bold tracking-[2px] uppercase text-s-text3 border-b border-s-border">Slot</th>
              <th className="text-center px-3 py-3 text-[10px] font-bold tracking-[2px] uppercase text-s-text3 border-b border-s-border">Avg Finish</th>
              <th className="text-center px-3 py-3 text-[10px] font-bold tracking-[2px] uppercase text-s-text3 border-b border-s-border"># Seasons</th>
              <th className="text-center px-3 py-3 text-[10px] font-bold tracking-[2px] uppercase text-s-text3 border-b border-s-border">Made Playoffs</th>
            </tr>
          </thead>
          <tbody>
            {slots.map(slot => {
              const d = avgBySlot[slot]
              const avg = d?.finishes.length
                ? (d.finishes.reduce((a, b) => a + b, 0) / d.finishes.length)
                : null
              const isOpen = selectedSlot === slot
              const slotRows = rows.filter(r => r.slot === slot)

              return (
                <>
                  <tr
                    key={`slot-${slot}`}
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
                    <td className="px-3 py-3 text-center text-[13px] text-s-text3">{d?.total ?? 0}</td>
                    <td className="px-3 py-3 text-center text-[12px] text-s-text2">
                      {d ? `${d.playoffs} / ${d.total}` : '—'}
                    </td>
                  </tr>

                  {isOpen && (
                    <tr key={`slot-${slot}-detail`}>
                      <td colSpan={4} className="px-4 py-0 border-b border-s-border/40 bg-s-bg3/20">
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
                                        ? 'bg-green-500/20 text-green-400'
                                        : 'bg-red-500/20 text-red-400'
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
                </>
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
              <th className="text-left px-4 py-3 text-[10px] font-bold tracking-[2px] uppercase text-s-text3 border-b border-s-border">Manager</th>
              <th className="text-center px-3 py-3 text-[10px] font-bold tracking-[2px] uppercase text-s-text3 border-b border-s-border">Avg Slot</th>
              <th className="text-center px-3 py-3 text-[10px] font-bold tracking-[2px] uppercase text-s-text3 border-b border-s-border"># Drafts</th>
            </tr>
          </thead>
          <tbody>
            {managerAvgSlot.map((row, i) => (
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
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
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

// ─── Past Draft History ───────────────────────────────────────────────────────

function PastDrafts() {
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

// ─── Draft Page ───────────────────────────────────────────────────────────────

export default function DraftPage() {
  const { state } = useLeague()
  const { loaded, error } = state
  const { draftStructure, loading: strategyLoading } = usePlayersData()

  const [activeTab, setActiveTab] = useState<Tab>('pickorder')
  const [currentPrices, setCurrentPrices] = useState<Record<string, number>>({})
  const [priceLoading, setPriceLoading]   = useState(true)
  const [lastUpdated, setLastUpdated]     = useState<Date | null>(null)

  const fetchPrices = useCallback(async () => {
    setPriceLoading(true)
    const tickers = [
      ...STOCK_PICKS_2026.map(p => p.ticker),
      MARKET_BENCHMARK_2026.ticker,
    ]
    const prices = await fetchCurrentPrices(tickers)
    setCurrentPrices(prices)
    setLastUpdated(new Date())
    setPriceLoading(false)
  }, [])

  useEffect(() => { fetchPrices() }, [fetchPrices])

  if (error) return <ErrorState error={error} />
  if (!loaded) return <LoadingSpinner />

  return (
    <div className="animate-fade-in">
      <h1 className="text-[26px] font-extrabold text-s-text mb-1">Draft Hub</h1>
      <p className="text-[13px] text-s-text3 mb-5">
        Draft history, 2026 pick order standings, slot vs outcome analysis, and historical steals & busts
      </p>

      {/* Tab nav */}
      <div className="flex items-center gap-[6px] mb-5 flex-wrap">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={[
              'px-4 py-[7px] rounded-[8px] border text-[12px] font-bold transition-all duration-150 cursor-pointer',
              activeTab === tab.id
                ? 'bg-s-gold text-[#000] border-s-gold'
                : 'bg-s-bg2 border-s-border text-s-text2 hover:border-s-border2 hover:text-s-text',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
        {activeTab === 'pickorder' && (
          <button
            onClick={fetchPrices}
            disabled={priceLoading}
            className="ml-auto px-3 py-[5px] text-[11px] font-semibold rounded-[6px] border border-s-border text-s-text3 bg-s-bg3 hover:border-s-border2 hover:text-s-text2 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {priceLoading ? 'Refreshing…' : '↻ Refresh'}
          </button>
        )}
      </div>

      {/* ── 2026 PICK ORDER TAB ───────────────────────────────────── */}
      {activeTab === 'pickorder' && (
        <>
          <div className="text-[11px] text-s-text3 mb-3">Jan 12 → Jul 15 · Best ROI picks first</div>
          <StockStandings
            picks={STOCK_PICKS_2026}
            currentPrices={currentPrices}
            loading={priceLoading}
            lastUpdated={lastUpdated}
          />
        </>
      )}

      {/* ── PAST DRAFTS TAB ──────────────────────────────────────── */}
      {activeTab === 'history' && <PastDrafts />}

      {/* ── SLOT ANALYSIS TAB ────────────────────────────────────── */}
      {activeTab === 'slots' && (
        <>
          <p className="text-[11px] text-s-text3 mb-3">
            Click any slot to see historical managers, finishes, and playoff rates.
          </p>
          <DraftSlotTable />
        </>
      )}

      {/* ── STEALS & BUSTS TAB ───────────────────────────────────── */}
      {activeTab === 'steals' && (
        <>
          <p className="text-[11px] text-s-text3 mb-3">
            Based on draft position within each position group vs actual points scored that season.
          </p>
          <StealsBusts />
        </>
      )}

      {/* ── DRAFT STRATEGY TAB ───────────────────────────────────── */}
      {activeTab === 'strategy' && (
        <>
          <p className="text-[11px] text-s-text3 mb-3">
            Based on rounds 1–5 position selection across all seasons.
          </p>
          {strategyLoading && !draftStructure.length
            ? <div className="text-s-text3 text-[12px] text-center py-12">Loading draft picks…</div>
            : <DraftStructureTable data={draftStructure} />
          }
        </>
      )}
    </div>
  )
}
