'use client'

import { useMemo } from 'react'
import { useUrlParam } from '@/hooks/useUrlParam'
import { useLeague } from '@/context/LeagueContext'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ErrorState from '@/components/shared/ErrorState'
import PillTabs from '@/components/shared/PillTabs'
import PageHeader from '@/components/shared/PageHeader'
import CareerLeaderboard from '@/components/owners/CareerLeaderboard'
import AnnualBreakdown from '@/components/owners/AnnualBreakdown'
import RivalryCalc from '@/components/owners/RivalryCalc'
import { BuiltAvatars } from '@/components/shared/OwnerAvatar'
import { careerBoards, type CareerBoards } from '@/lib/stats'

/** The Career Leaderboard worked out from the snapshot at build time (app/owners/page.tsx), so the tab is in the HTML. */
export interface BuiltBoards {
  avatars: Record<string, string>
  boards: CareerBoards
}

type Tab = 'leaderboard' | 'earnings' | 'h2h'

const TABS: { id: Tab; label: string }[] = [
  { id: 'leaderboard', label: 'Career Leaderboard' },
  { id: 'earnings',    label: 'Earnings Ledger'    },
  { id: 'h2h',         label: 'Head-to-Head'       },
]
const TAB_IDS = TABS.map(t => t.id)
const NO_AVATARS: Record<string, string> = {}

export default function OwnersPage({ built }: { built: BuiltBoards | null }) {
  const { state } = useLeague()
  const { loaded, error } = state
  const [activeTab, setActiveTab] = useUrlParam<Tab>('tab', 'leaderboard', TAB_IDS)
  const boards = useMemo(() => (loaded ? careerBoards(state) : built?.boards), [loaded, state, built])

  if (error) return <ErrorState error={error} />

  // The title and tabs paint at once; only what's under them waits for data
  const shell = (
    <>
      <PageHeader
        kicker="The Managers"
        title="Owner Profiles"
        subtitle="Tap any row to drill into career stats, H2H records & game log"
      />
      <PillTabs tabs={TABS} active={activeTab} onChange={setActiveTab} />
    </>
  )
  // The leaderboard is baked into the HTML from the build; every other tab waits on the spinner
  if (!loaded && !(boards && activeTab === 'leaderboard')) return <div className="animate-fade-in">{shell}<LoadingSpinner /></div>

  return (
    <div className="animate-fade-in">
      {shell}

      {/* Same elements before and after the load (only their values update), so nothing repaints.
          data-baked lets a deep link hide this until the page takes over (globals.css). */}
      {activeTab === 'leaderboard' && boards && (
        <div data-baked={loaded ? undefined : ''}>
          <BuiltAvatars.Provider value={built?.avatars ?? NO_AVATARS}>
            <CareerLeaderboard boards={boards} />
          </BuiltAvatars.Provider>
        </div>
      )}
      {!loaded && <div data-baked-fallback><LoadingSpinner /></div>}
      {activeTab === 'earnings' && <AnnualBreakdown />}
      {activeTab === 'h2h' && <RivalryCalc />}
    </div>
  )
}
