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
    <div className="bg-s-bg2 border border-s-border rounded-[12px] p-[18px] mb-4">
      <div className="text-[10px] font-bold tracking-[2.5px] uppercase text-s-text3 mb-3">
        Average Score by Season (Points Per Team Per Game)
      </div>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid stroke="#1e2d45" strokeDasharray="3 3" />
            <XAxis
              dataKey="year"
              tick={{ fill: '#475569', fontSize: 11 }}
              axisLine={{ stroke: '#1e2d45' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#475569', fontSize: 11 }}
              axisLine={{ stroke: '#1e2d45' }}
              tickLine={false}
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={{
                background: '#1a2234',
                border: '1px solid #1e2d45',
                borderRadius: 8,
                color: '#e2e8f0',
                fontSize: 12,
              }}
              formatter={(val: number) => [`${val.toFixed(2)} pts`, 'Avg']}
            />
            <Line
              type="monotone"
              dataKey="avg"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ fill: '#f59e0b', r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, fill: '#fbbf24' }}
              fill="rgba(245,158,11,0.1)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
