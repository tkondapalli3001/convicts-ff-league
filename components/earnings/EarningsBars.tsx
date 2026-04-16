import { EARNINGS_DATA } from '@/lib/constants'
import { ownerColor } from '@/lib/utils'

export default function EarningsBars() {
  const maxAbs = Math.max(...EARNINGS_DATA.map(e => Math.abs(e.total)))

  return (
    <div className="bg-s-bg2 border border-s-border rounded-[12px] p-[18px] mb-4">
      <div className="text-[10px] font-bold tracking-[2.5px] uppercase text-s-text3 mb-[14px]">
        Net Payout Ranking
      </div>
      <div className="space-y-[5px]">
        {EARNINGS_DATA.map((e, i) => {
          const pct = (Math.abs(e.total) / maxAbs * 100).toFixed(1)
          const pos = e.total >= 0
          const color = ownerColor(e.owner)
          const rankColors = ['bg-[#3d2000] text-s-gold', 'bg-[#1a2030] text-[#b0c4de]', 'bg-[#1a1000] text-[#cd7f32]']
          const rankCls = i < 3 ? rankColors[i] : 'bg-s-bg4 text-s-text3'

          return (
            <div key={e.owner} className="flex items-center gap-[10px]">
              <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-[11px] font-extrabold flex-shrink-0 ${rankCls}`}>
                {i + 1}
              </span>
              <div className="w-[80px] text-[12px] font-bold text-right flex-shrink-0" style={{ color }}>
                {e.owner}
              </div>
              <div className="flex-1 h-6 bg-s-bg3 rounded-[5px] overflow-hidden relative border border-s-border">
                <div
                  className={`h-full flex items-center justify-end pr-[10px] text-[11px] font-bold rounded-[5px] transition-all duration-500 ${
                    pos
                      ? 'bg-gradient-to-r from-[#052e16] to-[#065f46] text-[#4ade80]'
                      : 'bg-gradient-to-r from-[#7f1d1d] to-[#991b1b] text-[#fca5a5]'
                  }`}
                  style={{ width: `${pct}%` }}
                >
                  {pos ? '+' : ''}${e.total}
                </div>
              </div>
              <div className={`w-[60px] text-[13px] font-extrabold flex-shrink-0 ${pos ? 'text-s-green' : 'text-s-red'}`}>
                {pos ? '+' : ''}${e.total}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
