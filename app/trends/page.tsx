'use client'

import { useState } from 'react'
import { useLeague } from '@/context/LeagueContext'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ErrorState from '@/components/shared/ErrorState'
import FinishTracker from '@/components/trends/FinishTracker'
import AvgScoreChart from '@/components/trends/AvgScoreChart'
import TrashTalkCard from '@/components/trends/TrashTalkCard'
import { TRASH_TALK } from '@/lib/constants'

type Tab = 'finish' | 'scoring' | 'trashtalk'

const TABS: { id: Tab; label: string }[] = [
  { id: 'finish',    label: 'Finish Tracker' },
  { id: 'scoring',   label: 'Scoring'        },
  { id: 'trashtalk', label: 'Trash Talk'     },
]

export default function TrendsPage() {
  const { state } = useLeague()
  const { loaded, error } = state
  const [activeTab, setActiveTab] = useState<Tab>('finish')

  if (error) return <ErrorState error={error} />
  if (!loaded) return <LoadingSpinner />

  return (
    <div className="animate-fade-in">
      <h1 className="text-[26px] font-extrabold text-s-text mb-1">Trends & Trash Talk</h1>
      <p className="text-[13px] text-s-text3 mb-5">Year-over-year performance tracker + roast material</p>

      {/* Tab nav */}
      <div className="flex gap-[6px] mb-5 flex-wrap">
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
      </div>

      {activeTab === 'finish'    && <FinishTracker />}
      {activeTab === 'scoring'   && <AvgScoreChart />}
      {activeTab === 'trashtalk' && (
        <>
          <div className="text-[10px] font-bold tracking-[3px] uppercase text-s-text3 mb-3">🔥 Trash Talk Corner</div>
          {TRASH_TALK.map(t => (
            <TrashTalkCard key={t.owner} {...t} />
          ))}
        </>
      )}
    </div>
  )
}
