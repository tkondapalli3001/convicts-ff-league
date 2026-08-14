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
import DraftStructureTable from '@/components/players/DraftStructureTable'
import { STOCK_PICKS_2026 } from '@/lib/stock-picks'

type Tab = 'pickorder' | 'history' | 'slots' | 'steals' | 'strategy'

const TABS: { id: Tab; label: string }[] = [
  { id: 'pickorder', label: '2026 Pick Order'  },
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
        subtitle="Draft history, 2026 pick order standings, slot vs outcome analysis, and historical steals & busts"
      />

      <DraftCountdown />

      <PillTabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {/* ── 2026 PICK ORDER TAB ───────────────────────────────────── */}
      {activeTab === 'pickorder' && (
        <>
          <div className="text-[11px] text-s-text3 mb-3">
            Jan 12 → Jul 15 · Best ROI drafts first
          </div>
          <StockStandings picks={STOCK_PICKS_2026} />
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
