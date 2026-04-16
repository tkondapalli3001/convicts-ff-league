'use client'

import { useLeague } from '@/context/LeagueContext'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ErrorState from '@/components/shared/ErrorState'
import RecordItem from '@/components/shared/RecordItem'
import AnnualBreakdown from '@/components/earnings/AnnualBreakdown'

export default function EarningsPage() {
  const { state } = useLeague()
  const { loaded, error } = state

  if (error) return <ErrorState error={error} />
  if (!loaded) return <LoadingSpinner />

  return (
    <div className="animate-fade-in">
      <h1 className="text-[26px] font-extrabold text-s-text mb-1">Earnings Ledger</h1>
      <p className="text-[13px] text-s-text3 mb-6">
        Net payout across all seasons · Buy-ins: $20→$30→$40→$50→$75→$100→$125
      </p>

      <AnnualBreakdown />

      {/* Fun Facts */}
      <div className="bg-s-bg2 border border-s-border rounded-[12px] p-[18px]">
        <div className="text-[10px] font-bold tracking-[2.5px] uppercase text-s-text3 mb-[14px]">
          Fun Facts 💸
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          <RecordItem
            icon="🤑"
            label="Biggest Single-Year Haul"
            value="+$675"
            context="Kerry 2025 — first-time champion, biggest payout in league history"
          />
          <RecordItem
            icon="🩸"
            label="All-Time Money Lost"
            value="-$410"
            context="Teja — 7 seasons, 0 championships, 1x toilet bowl (2021)"
          />
          <RecordItem
            icon="📈"
            label="Best Net Earnings"
            value="+$450"
            context="Kerry — won it all in 2025 after three miserable seasons"
          />
          <RecordItem
            icon="📉"
            label="Worst Single Year (Multiple)"
            value="-$125"
            context="Seven owners in 2025 — highest buy-in season to date"
          />
        </div>
      </div>
    </div>
  )
}
