'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useLeague } from '@/context/LeagueContext'

export default function AvgScoreChart() {
  const { state } = useLeague()
  const { allMatchups, years } = state
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const data = years.map(y => {
    const games = allMatchups.filter(g => g.year === y)
    if (!games.length) return { year: String(y), avg: 0 }
    const total = games.reduce((a, g) => a + g.pts1 + g.pts2, 0)
    return { year: String(y), avg: parseFloat((total / (games.length * 2)).toFixed(2)) }
  })

  if (!mounted || !years.length) {
    return (
      <div className="h-[200px] bg-s-bg3 rounded-[10px] animate-pulse" />
    )
  }

  return (
    <div className="gl relative overflow-hidden p-[18px] mb-4">
      <div className="bento-fill" style={{ background: 'rgba(59,130,246,0.15)' }} />
      <div className="text-[10px] font-bold tracking-[2.5px] uppercase text-gold-soft mb-3 relative z-10">
        Average Score by Season (Points Per Team Per Game)
      </div>
      <div className="h-[200px] relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid stroke="#241f14" strokeDasharray="3 3" />
            <XAxis
              dataKey="year"
              tick={{ fill: '#5C6270', fontSize: 11 }}
              axisLine={{ stroke: '#241f14' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#5C6270', fontSize: 11 }}
              axisLine={{ stroke: '#241f14' }}
              tickLine={false}
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={{
                background: '#0B0B0D',
                border: '1px solid #241f14',
                borderRadius: 8,
                color: '#EDE9E0',
                fontSize: 12,
              }}
              formatter={(val: number) => [`${val.toFixed(2)} pts`, 'Avg']}
            />
            <Line
              type="monotone"
              dataKey="avg"
              stroke="#C9962E"
              strokeWidth={2}
              dot={{ fill: '#C9962E', r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, fill: '#E8CE8A' }}
              fill="rgba(201,150,46,0.1)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
