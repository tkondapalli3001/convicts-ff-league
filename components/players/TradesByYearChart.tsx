'use client'

import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList,
} from 'recharts'
import type { EnrichedTransaction } from '@/hooks/useTransactionsData'

interface Props {
  transactions: EnrichedTransaction[]
  activeYears: Set<number>
  activeOwners: Set<string>
  years: number[]
}

interface ChartEntry {
  year: number
  count: number
}

export default function TradesByYearChart({ transactions, activeYears, activeOwners, years }: Props) {
  const data = useMemo<ChartEntry[]>(() => {
    return [...years]
      .sort((a, b) => a - b)
      .filter(y => activeYears.has(y))
      .map(year => {
        const count = transactions.filter(tx => {
          if (tx.type !== 'trade') return false
          if (tx.year !== year) return false
          if (activeOwners.size > 0) {
            return tx.ownerNames.some(n => activeOwners.has(n))
          }
          return true
        }).length
        return { year, count }
      })
  }, [transactions, activeYears, activeOwners, years])

  const total = data.reduce((s, d) => s + d.count, 0)

  return (
    <div className="bg-s-bg2 border border-s-border rounded-[12px] p-[18px] mb-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[10px] font-bold tracking-[2.5px] uppercase text-s-text3">
            Trades by Season
          </div>
          <div className="text-[22px] font-extrabold text-s-text leading-none mt-0.5">
            {total}
            <span className="text-[13px] text-s-text3 font-normal ml-1">
              trade{total !== 1 ? 's' : ''}
              {activeOwners.size > 0 ? ` involving ${[...activeOwners].join(', ')}` : ''}
            </span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -20 }} barSize={28}>
          <XAxis
            dataKey="year"
            tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: '#64748b', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: 'rgba(201, 150, 46, 0.08)' }}
            contentStyle={{
              background: '#0d1117',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8,
              fontSize: 12,
              color: '#e2e8f0',
            }}
            itemStyle={{ color: '#e2e8f0' }}
            labelStyle={{ color: '#9AA0AC' }}
            formatter={(val: number) => [val, 'Trades']}
            labelFormatter={(label) => `${label} Season`}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((entry) => (
              <Cell
                key={entry.year}
                fill={entry.count > 0 ? '#C9A24B' : '#241f14'}
                fillOpacity={entry.count > 0 ? 0.85 : 1}
              />
            ))}
            <LabelList
              dataKey="count"
              position="top"
              formatter={(val: number) => (val > 0 ? val : '')}
              style={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
