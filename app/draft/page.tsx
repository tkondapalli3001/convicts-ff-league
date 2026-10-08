'use client'

import { useState } from 'react'
import { useLeague } from '@/context/LeagueContext'
import { usePlayersData } from '@/hooks/usePlayersData'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ErrorState from '@/components/shared/ErrorState'
import PillTabs from '@/components/shared/PillTabs'
import PageHeader from '@/components/shared/PageHeader'
import DraftCountdown from '@/components/draft/DraftCountdown'
import StockStandings from '@/components/draft/StockStandings'
import StealsBusts from '@/components/draft/StealsBusts'
import DraftSlotAnalysis from '@/components/draft/DraftSlotAnalysis'
import PastDrafts from '@/components/draft/PastDrafts'
import DraftStructureTable from '@/components/draft/DraftStructureTable'
import { STOCK_PICKS, MARKET_BENCHMARK, STOCK_PICK_SEASON } from '@/lib/league'
import { fmtDate } from '@/lib/utils'

type Tab = 'pickorder' | 'history' | 'slots' | 'steals' | 'strategy'

const TABS: { id: Tab; label: string }[] = [
  { id: 'pickorder', label: `${STOCK_PICK_SEASON} Pick Order` },
  { id: 'history',   label: 'Past Drafts'      },
  { id: 'slots',     label: 'Slot Analysis'    },
  { id: 'steals',    label: 'Steals & Busts'   },
  { id: 'strategy',  label: 'Draft Strategy'   },
]

export default function DraftPage() {
  const { state } = useLeague()
  const { loaded, error } = state
  const { draftStructure, loading: strategyLoading } = usePlayersData()

  const [activeTab, setActiveTab] = useState<Tab>('pickorder')

  if (error) return <ErrorState error={error} />
  if (!loaded) return <LoadingSpinner />

  return (
    <div className="animate-fade-in">
      <PageHeader
        kicker="The Draft Room"
        title="Draft Hub"
        subtitle={`Draft history, ${STOCK_PICK_SEASON} pick order standings, slot vs outcome analysis, and historical steals & busts`}
      />

      <DraftCountdown />

      <PillTabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {/* ── PICK ORDER TAB ───────────────────────────────────────── */}
      {activeTab === 'pickorder' && (
        <>
          <div className="text-[11px] text-s-text3 mb-3">
            {fmtDate(MARKET_BENCHMARK.startDate, 'short', false)} → {fmtDate(MARKET_BENCHMARK.endDate, 'short', false)} · Best ROI drafts first
          </div>
          <StockStandings picks={STOCK_PICKS} />
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
          <DraftSlotAnalysis />
        </>
      )}

      {/* ── STEALS & BUSTS TAB ───────────────────────────────────── */}
      {activeTab === 'steals' && <StealsBusts />}

      {/* ── DRAFT STRATEGY TAB ───────────────────────────────────── */}
      {activeTab === 'strategy' && (
        <>
          {strategyLoading && !draftStructure.length
            ? <div className="text-s-text3 text-[12px] text-center py-12">Loading draft picks…</div>
            : <DraftStructureTable data={draftStructure} />
          }
        </>
      )}
    </div>
  )
}
