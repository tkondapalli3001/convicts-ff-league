'use client'

import { LineChart, Line, ResponsiveContainer } from 'recharts'

interface Props {
  data: number[]
  color?: string
  width?: number
  height?: number
}

export default function SparklineMini({ data, color = '#00ceb8', width = 60, height = 22 }: Props) {
  if (data.length < 2) return <div style={{ width, height }} />
  const chartData = data.map((v, i) => ({ i, v }))
  return (
    <div style={{ width, height, flexShrink: 0 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
