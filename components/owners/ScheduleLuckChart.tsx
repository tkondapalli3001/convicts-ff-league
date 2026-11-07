'use client'

import { useMemo } from 'react'
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useLeague } from '@/context/LeagueContext'
import { useUrlParam } from '@/hooks/useUrlParam'
import SectionCard from '@/components/shared/SectionCard'
import InfoTip from '@/components/shared/InfoTip'
import { scheduleSamples, scheduleSeedKey, scheduleWeeks, type UncertaintySummary } from '@/lib/stats'
import { hashSeed, rng } from '@/lib/current-season'
import uncertaintyData from '@/public/data/uncertainty.json'

const U = uncertaintyData as UncertaintySummary
const GOLD = '#C9962E'
const MUTED = '#3A4150'
const AXIS = '#5C6270'

const wins = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1))

/**
 * Owner profile → Season Log: the owner's record against every shuffled
 * schedule. The same seeded shuffles `npm run uncertainty` drew (a test holds
 * them equal), so the bars and the luck notes agree to the decimal.
 */
export default function ScheduleLuckChart({ ownerName }: { ownerName: string }) {
  const { state } = useLeague()

  const years = useMemo(() => Object.keys(U.luck).filter(k => k !== 'career' && U.luck[k][ownerName]).map(Number).sort((a, b) => a - b), [ownerName])
  const choices = ['career', ...years.map(String)]
  const [pick, setPick] = useUrlParam('luck', 'career')
  const choice = choices.includes(pick) ? pick : 'career'
  const quoted = U.luck[choice]?.[ownerName]

  // Wins under every shuffle, summed across seasons for the career view
  const bars = useMemo(() => {
    const picked = choice === 'career' ? years : [Number(choice)]
    const total = new Float64Array(U.sims)
    for (const y of picked) {
      const reg = state.allMatchups.filter(g => g.year === y && g.type === 'R')
      const sample = scheduleSamples(scheduleWeeks(reg), U.sims, rng(hashSeed(scheduleSeedKey(y))))[ownerName]
      if (sample) for (let i = 0; i < U.sims; i++) total[i] += sample[i]
    }
    const counts = new Map<number, number>()
    for (const v of total) counts.set(v, (counts.get(v) ?? 0) + 1)
    return [...counts.entries()].sort((a, b) => a[0] - b[0]).map(([w, n]) => ({ wins: w, share: (n / U.sims) * 100 }))
  }, [choice, years, ownerName, state.allMatchups])

  if (!quoted || !years.length) return null
  const sims = U.sims.toLocaleString('en-US')

  return (
    <SectionCard
      title="Record vs. Every Schedule"
      className="mt-4"
      action={<InfoTip term="Record vs. every schedule">the same weekly scores, {sims} different schedules: each keeps the league’s real weekly pairings and randomly reassigns who sat in each slot. The gold bar is the record actually played. Regular season only.</InfoTip>}
    >
      <div className="flex flex-wrap gap-1.5 px-4 pt-3 sm:px-5" role="group" aria-label="Season">
        {choices.map(c => (
          <button
            key={c}
            type="button"
            aria-pressed={c === choice}
            onClick={() => setPick(c)}
            className={`min-h-[32px] rounded-full border px-3 text-[11px] font-semibold transition-colors sm:min-h-0 sm:py-1 ${c === choice ? 'border-gold bg-[rgba(201,150,46,0.10)] text-gold-soft' : 'border-[rgba(230,190,90,0.14)] text-s-text3 hover:text-gold-soft'}`}
          >
            {c === 'career' ? 'Career' : c}
          </button>
        ))}
      </div>

      <div className="px-4 pt-3 sm:px-5">
        <div className="font-display text-[22px] font-bold uppercase leading-tight text-s-text">
          {wins(quoted.actual)} wins <span className="text-s-text3">·</span> beats {Math.round(quoted.pct)}% of schedules
        </div>
        <div className="text-[11px] text-s-text3">Shuffled schedules average {quoted.avg.toFixed(1)} wins</div>
      </div>

      <div className="h-[180px] px-1 pb-3 pt-2 sm:h-[220px] sm:px-3" role="img" aria-label={`${ownerName} won ${wins(quoted.actual)}; across ${sims} shuffled schedules the average is ${quoted.avg.toFixed(1)}, and the actual record beats ${Math.round(quoted.pct)}% of them.`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bars} margin={{ top: 8, right: 12, left: -6, bottom: 0 }} barCategoryGap={2}>
              <XAxis dataKey="wins" tickFormatter={wins} tick={{ fill: AXIS, fontSize: 11 }} axisLine={{ stroke: '#241f14' }} tickLine={false} interval="preserveStartEnd" minTickGap={12} />
              <YAxis tickFormatter={v => `${v}%`} tick={{ fill: AXIS, fontSize: 11 }} axisLine={false} tickLine={false} width={44} />
              <Tooltip
                cursor={{ fill: 'rgba(var(--gold2-rgb), 0.06)' }}
                content={({ active, payload }) => {
                  const d = payload?.[0]?.payload as { wins: number; share: number } | undefined
                  if (!active || !d) return null
                  return (
                    <div className="rounded-[4px] px-3 py-2 text-[12px]" style={{ background: '#16161B', border: '1px solid rgba(var(--gold-rgb), 0.24)' }}>
                      <div className="font-bold text-s-text">{wins(d.wins)} wins{d.wins === quoted.actual ? ' (actual)' : ''}</div>
                      <div className="text-s-text3">{d.share < 0.1 ? '<0.1' : d.share.toFixed(1)}% of schedules</div>
                    </div>
                  )
                }}
              />
              <Bar dataKey="share" radius={[2, 2, 0, 0]} isAnimationActive={false}>
                {bars.map(b => <Cell key={b.wins} fill={b.wins === quoted.actual ? GOLD : MUTED} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
      </div>
    </SectionCard>
  )
}
