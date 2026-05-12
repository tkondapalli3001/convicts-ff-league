import type { ReactNode } from 'react'

interface Props {
  label: string
  value: string | number
  sub?: string
  valueColor?: string
  icon?: ReactNode
}

export default function StatBox({ label, value, sub, valueColor, icon }: Props) {
  return (
    <div className="nebula-card p-[14px] group">
      <div className="flex items-center justify-between mb-[6px]">
        <div className="text-[10px] text-slate-500 tracking-[1.5px] uppercase font-semibold">
          {label}
        </div>
        {icon && (
          <div className="text-slate-600 group-hover:text-violet-400 transition-colors duration-200">
            {icon}
          </div>
        )}
      </div>
      <div
        className="text-[22px] font-extrabold leading-none font-mono tabular-nums tracking-tight"
        style={valueColor ? { color: valueColor } : { color: '#e2e8f0' }}
      >
        {value}
      </div>
      {sub && (
        <div className="text-[11px] text-slate-500 mt-[5px]">{sub}</div>
      )}
    </div>
  )
}
