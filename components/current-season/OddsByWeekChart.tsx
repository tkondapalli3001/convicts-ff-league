'use client'

import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import SectionCard from '@/components/shared/SectionCard'
import InfoTip from '@/components/shared/InfoTip'
import { useMe } from '@/hooks/useMe'
import { useUrlParam } from '@/hooks/useUrlParam'
import { DEFAULT_SIMS, formatOdds, type WeekOdds } from '@/lib/current-season'

const GOLD = '#E8CE8A'
const MUTED = '#3A4150'
const AXIS = '#5C6270'
const GRID = '#241f14'

/**
 * Season tab → Power Rankings: every team's playoff odds entering each week,
 * one team in gold and the rest in gray. Each point is the number the tab
 * showed that week, from the same simulation.
 */
export default function OddsByWeekChart({ data }: { data: WeekOdds[] }) {
  const { me } = useMe()
  const [picked, setPicked] = useUrlParam('odds', '')

  const last = data[data.length - 1]
  // Best odds first, so the chips read like a standings table
  const teams = useMemo(() => (last ? Object.keys(last.odds).sort((a, b) => last.odds[b] - last.odds[a] || a.localeCompare(b)) : []), [last])
  const rows = useMemo(() => data.map(d => ({ week: `W${d.week}`, ...Object.fromEntries(teams.map(t => [t, Math.round(d.odds[t] * 1000) / 10])) })), [data, teams])

  if (data.length < 2 || !last) return null
  const team = teams.includes(picked) ? picked : me && teams.includes(me) ? me : teams[0]
  const fmt = (d: WeekOdds) => formatOdds(d.odds[team] ?? 0, d.status[team])

  return (
    <SectionCard
      title="Playoff Odds by Week"
      className="mt-4"
      action={<InfoTip term="Playoff odds by week">each point is the chance the season tab gave entering that week: the rest of the season simulated {DEFAULT_SIMS.toLocaleString('en-US')} times from the games already played, nothing later. 100% and 0% are exact clinches and eliminations.</InfoTip>}
    >
      <div className="px-4 pt-3 sm:px-5">
        <div className="font-display text-[22px] font-bold uppercase leading-tight text-s-text">
          {team} <span className="text-s-text3">·</span> <span style={{ color: GOLD }}>{fmt(last)}</span>
        </div>
        <div className="text-[11px] text-s-text3">{fmt(data[0])} entering week {data[0].week}, {fmt(last)} entering week {last.week}</div>
      </div>

      <div className="h-[220px] px-1 pt-2 sm:h-[260px] sm:px-3" role="img" aria-label={`${team}'s playoff odds entering each week: ${data.map(d => `week ${d.week} ${fmt(d)}`).join(', ')}`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
              <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="week" tick={{ fill: AXIS, fontSize: 11 }} axisLine={{ stroke: GRID }} tickLine={false} interval="preserveStartEnd" />
              <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={v => `${v}%`} tick={{ fill: AXIS, fontSize: 11 }} axisLine={false} tickLine={false} width={44} />
              <Tooltip
                cursor={{ stroke: 'rgba(var(--gold-rgb), 0.35)' }}
                content={({ active, label }) => {
                  const d = data.find(x => `W${x.week}` === label)
                  if (!active || !d) return null
                  return (
                    <div className="rounded-[4px] px-3 py-2 text-[12px]" style={{ background: '#16161B', border: '1px solid rgba(var(--gold-rgb), 0.24)' }}>
                      <div className="text-[9px] font-bold uppercase tracking-[1.5px] text-s-text3">Entering week {d.week}</div>
                      <div className="font-bold text-s-text">{team} {fmt(d)}</div>
                    </div>
                  )
                }}
              />
              {teams.filter(t => t !== team).map(t => (
                <Line key={t} dataKey={t} stroke={MUTED} strokeWidth={1.5} dot={false} activeDot={false} isAnimationActive={false} />
              ))}
              <Line dataKey={team} stroke={GOLD} strokeWidth={2.5} dot={{ r: 3, fill: GOLD, strokeWidth: 0 }} activeDot={{ r: 5, fill: GOLD, stroke: '#0B0B0D', strokeWidth: 2 }} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
      </div>

      {/* Pick a team: the legend and the selector in one */}
      <div className="flex flex-wrap gap-1.5 border-t px-4 py-3 sm:px-5" style={{ borderColor: 'rgba(var(--gold-rgb), 0.10)' }} role="group" aria-label="Team">
        {teams.map(t => (
          <button
            key={t}
            type="button"
            aria-pressed={t === team}
            onClick={() => setPicked(t === (me ?? teams[0]) ? '' : t)}
            className={`min-h-[32px] rounded-full border px-3 text-[11px] font-semibold transition-colors sm:min-h-0 sm:py-1 ${t === team ? 'border-gold bg-[rgba(201,150,46,0.10)] text-gold-soft' : 'border-[rgba(230,190,90,0.14)] text-s-text3 hover:text-gold-soft'}`}
          >
            {t} <span className="font-display text-[13px]">{formatOdds(last.odds[t], last.status[t])}</span>
          </button>
        ))}
      </div>
    </SectionCard>
  )
}
