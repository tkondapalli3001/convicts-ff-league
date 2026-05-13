'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useLeague } from '@/context/LeagueContext'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ErrorState from '@/components/shared/ErrorState'
import StockStandings from '@/components/draft/StockStandings'
import {
  STOCK_PICKS_2026,
  MARKET_BENCHMARK_2026,
  fetchCurrentPrices,
} from '@/lib/stock-picks'
import { resolveOwnerName } from '@/lib/data-processing'

type Tab = 'pickorder' | 'history' | 'slots'

const TABS: { id: Tab; label: string }[] = [
  { id: 'pickorder', label: '2026 Pick Order' },
  { id: 'history',   label: 'Past Drafts'     },
  { id: 'slots',     label: 'Slot Analysis'   },
]

// ─── Draft Slot vs Final Standings ───────────────────────────────────────────

function DraftSlotTable() {
  const { state } = useLeague()
  const { draftData, rosterUserMaps, ownerSeasons, years } = state

  const rows = useMemo(() => {
    const out: { year: number; owner: string; slot: number; finish: number | null; wl: string }[] = []
    for (const year of [...years].sort((a, b) => b - a)) {
      const data = draftData[year]
      if (!data?.picks?.length) continue
      const rMap = rosterUserMaps[year] ?? {}

      // slot → owner name (from round 1 only)
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
          wl: season ? `${season.wins}–${season.losses}` : '—',
        })
      }
    }
    return out
  }, [draftData, rosterUserMaps, ownerSeasons, years])

  // Average finish by slot
  const avgBySlot = useMemo(() => {
    const acc: Record<number, number[]> = {}
    for (const row of rows) {
      if (row.finish !== null) {
        if (!acc[row.slot]) acc[row.slot] = []
        acc[row.slot].push(row.finish)
      }
    }
    return Object.fromEntries(
      Object.entries(acc).map(([slot, vals]) => [
        slot,
        (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1),
      ])
    )
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
    <div className="gl overflow-x-auto">
      <table className="w-full border-collapse min-w-[480px]">
        <thead>
          <tr>
            <th className="text-left px-4 py-3 text-[10px] font-bold tracking-[2px] uppercase text-s-text3 border-b border-s-border">Year</th>
            <th className="text-left px-4 py-3 text-[10px] font-bold tracking-[2px] uppercase text-s-text3 border-b border-s-border">Owner</th>
            <th className="text-center px-3 py-3 text-[10px] font-bold tracking-[2px] uppercase text-s-text3 border-b border-s-border">Draft Slot</th>
            <th className="text-center px-3 py-3 text-[10px] font-bold tracking-[2px] uppercase text-s-text3 border-b border-s-border">Final Finish</th>
            <th className="text-center px-3 py-3 text-[10px] font-bold tracking-[2px] uppercase text-s-text3 border-b border-s-border">W–L</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={`${row.year}-${row.owner}`} className={`border-b border-s-border/40 hover:bg-s-bg3/40 transition-colors ${i > 0 && rows[i - 1].year !== row.year ? 'border-t border-s-border' : ''}`}>
              <td className="px-4 py-2.5 text-[12px] font-bold text-s-text3">{row.year}</td>
              <td className="px-4 py-2.5 text-[13px] font-semibold text-s-text">{row.owner}</td>
              <td className="px-3 py-2.5 text-center text-[13px] font-bold text-s-text2">{row.slot}</td>
              <td className="px-3 py-2.5 text-center">
                <span className={`text-[13px] font-bold ${
                  row.finish === 1 ? 'text-s-gold'
                  : row.finish === 2 ? 'text-[#8b949e]'
                  : row.finish !== null && row.finish >= 9 ? 'text-s-red'
                  : 'text-s-text2'
                }`}>
                  {row.finish === null ? '—' : row.finish === 1 ? '🏆 1st' : `${row.finish}${ordinal(row.finish)}`}
                </span>
              </td>
              <td className="px-3 py-2.5 text-center text-[12px] text-s-text3">{row.wl}</td>
            </tr>
          ))}
        </tbody>
        {/* Average finish by slot */}
        <tfoot>
          <tr className="border-t-2 border-s-border bg-s-bg3/40">
            <td className="px-4 py-3 text-[10px] font-extrabold tracking-[2px] uppercase text-s-text3" colSpan={2}>
              Avg Finish by Slot
            </td>
            {slots.map(slot => (
              <td key={slot} className="px-3 py-3 text-center text-[12px] font-bold text-s-text2">
                {avgBySlot[slot] ?? '—'}
              </td>
            ))}
            <td />
          </tr>
          <tr className="bg-s-bg3/20">
            <td className="px-4 py-1.5 text-[9px] text-s-text3" colSpan={2}>Slot</td>
            {slots.map(slot => (
              <td key={slot} className="px-3 py-1.5 text-center text-[9px] text-s-text3">#{slot}</td>
            ))}
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

function ordinal(n: number) {
  if (n === 1) return 'st'
  if (n === 2) return 'nd'
  if (n === 3) return 'rd'
  return 'th'
}

// ─── Past Draft History ───────────────────────────────────────────────────────

function PastDrafts() {
  const { state } = useLeague()
  const { draftData, rosterUserMaps, years } = state

  const [openYear, setOpenYear] = useState<number | null>(null)

  const sortedYears = [...years].sort((a, b) => b - a)

  if (!Object.keys(draftData).length) {
    return (
      <div className="gl p-6 text-center text-s-text3 text-[12px]">
        No draft history available
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {sortedYears.map(year => {
        const data = draftData[year]
        if (!data) return null
        const { draft, picks } = data
        const rMap = rosterUserMaps[year] ?? {}
        const isOpen = openYear === year

        // Group picks by round
        const rounds = picks.reduce<Record<number, typeof picks>>((acc, p) => {
          if (!acc[p.round]) acc[p.round] = []
          acc[p.round].push(p)
          return acc
        }, {})
        const roundNums = Object.keys(rounds).map(Number).sort((a, b) => a - b)

        return (
          <div key={year} className="bento-card overflow-hidden">
            <button
              onClick={() => setOpenYear(isOpen ? null : year)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-s-bg3/30 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <span className="text-[14px] font-extrabold text-s-text">{year}</span>
                <span className="text-[10px] font-bold tracking-[1.5px] uppercase text-s-text3 bg-s-bg3 px-2 py-0.5 rounded-full border border-s-border">
                  {draft.type.toUpperCase()}
                </span>
                <span className="text-[11px] text-s-text3">
                  {picks.length} picks · {roundNums.length} rounds
                </span>
              </div>
              <span
                className="text-s-text3 text-[14px] leading-none transition-transform duration-200"
                style={{ display: 'inline-block', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
              >
                ▾
              </span>
            </button>

            {isOpen && (
              <div className="border-t border-s-border overflow-x-auto">
                <table className="w-full border-collapse text-[12px] min-w-[480px]">
                  <thead>
                    <tr>
                      <th className="text-left px-4 py-2.5 text-[9px] font-bold tracking-[2px] uppercase text-s-text3 border-b border-s-border/60 w-12">Rd</th>
                      <th className="text-left px-3 py-2.5 text-[9px] font-bold tracking-[2px] uppercase text-s-text3 border-b border-s-border/60 w-8">Pick</th>
                      <th className="text-left px-3 py-2.5 text-[9px] font-bold tracking-[2px] uppercase text-s-text3 border-b border-s-border/60">Manager</th>
                      <th className="text-left px-3 py-2.5 text-[9px] font-bold tracking-[2px] uppercase text-s-text3 border-b border-s-border/60">Player</th>
                      <th className="text-left px-3 py-2.5 text-[9px] font-bold tracking-[2px] uppercase text-s-text3 border-b border-s-border/60">Pos</th>
                      <th className="text-left px-3 py-2.5 text-[9px] font-bold tracking-[2px] uppercase text-s-text3 border-b border-s-border/60">Team</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roundNums.map(rnd =>
                      (rounds[rnd] ?? [])
                        .sort((a, b) => a.pick_no - b.pick_no)
                        .map(pick => {
                          const owner = rMap[String(pick.roster_id)] ?? `Slot ${pick.draft_slot}`
                          const playerName = [pick.metadata.first_name, pick.metadata.last_name].filter(Boolean).join(' ') || pick.player_id
                          return (
                            <tr key={pick.pick_no} className="border-b border-s-border/30 hover:bg-s-bg3/30 transition-colors">
                              <td className="px-4 py-2 text-s-text3 font-bold">{rnd}</td>
                              <td className="px-3 py-2 text-s-text3">{pick.pick_no}</td>
                              <td className="px-3 py-2 font-semibold text-s-text">
                                {owner}
                                {pick.is_keeper && (
                                  <span className="ml-1.5 text-[9px] font-bold text-s-gold bg-[#3d2000]/60 px-1.5 py-0.5 rounded border border-[#5a3000]/50">
                                    KEEP
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-s-text">{playerName}</td>
                              <td className="px-3 py-2 text-s-text3 font-medium">{pick.metadata.position ?? '—'}</td>
                              <td className="px-3 py-2 text-s-text3">{pick.metadata.team ?? '—'}</td>
                            </tr>
                          )
                        })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Draft Page ───────────────────────────────────────────────────────────────

export default function DraftPage() {
  const { state } = useLeague()
  const { loaded, error } = state

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
        Draft history, 2026 pick order standings, and slot vs outcome analysis
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
        {/* Refresh button inline when on pick order tab */}
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
          <div className="text-[11px] text-s-text3 mb-3">Jan 12 → Jul 15 · Best ROI drafts first</div>
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
            Did early picks translate to better finishes?
          </p>
          <DraftSlotTable />
        </>
      )}
    </div>
  )
}
