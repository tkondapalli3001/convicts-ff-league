import { EARNINGS_DATA } from '@/lib/constants'
import OwnerAvatar from '@/components/shared/OwnerAvatar'

export default function EarningsBars() {
  const maxAbs = Math.max(...EARNINGS_DATA.map(e => Math.abs(e.total)))

  return (
    <div className="gl p-[18px] mb-4 relative overflow-hidden">
      <div className="bento-fill" style={{ background: 'rgba(34,197,94,0.15)' }} />
      <div className="text-[10px] font-bold tracking-[2.5px] uppercase text-slate-400 mb-[14px] relative z-10">
        Net Payout Ranking
      </div>
      <div className="space-y-[6px]">
        {EARNINGS_DATA.map((e, i) => {
          const pct = (Math.abs(e.total) / maxAbs * 100).toFixed(1)
          const pos = e.total >= 0
          const rankColors = ['bg-[#3d2000] text-s-gold', 'bg-[#1a2030] text-[#b0c4de]', 'bg-[#1a1000] text-[#cd7f32]']
          const rankCls = i < 3 ? rankColors[i] : 'bg-s-bg4 text-s-text3'

          return (
            <div key={e.owner} className="flex items-center gap-[10px]">
              <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-[11px] font-extrabold flex-shrink-0 num ${rankCls}`}>
                {i + 1}
              </span>
              <div className="flex items-center gap-2 w-[110px] flex-shrink-0">
                <OwnerAvatar name={e.owner} size="sm" />
                <span className="text-[12px] font-bold text-s-text truncate">{e.owner}</span>
              </div>
              <div className="flex-1 h-6 bg-s-bg3 rounded-[5px] overflow-hidden relative border border-s-border">
                <div
                  className={`h-full flex items-center justify-end pr-[10px] text-[11px] font-bold rounded-[5px] transition-all duration-500 num ${
                    pos
                      ? 'bg-gradient-to-r from-[#052e16] to-[#065f46] text-[#4ade80]'
                      : 'bg-gradient-to-r from-[#7f1d1d] to-[#991b1b] text-[#fca5a5]'
                  }`}
                  style={{ width: `${pct}%` }}
                >
                  {pos ? '+' : ''}${e.total}
                </div>
              </div>
              <div className={`w-[60px] text-[13px] font-extrabold flex-shrink-0 num ${pos ? 'text-s-green' : 'text-s-red'}`}>
                {pos ? '+' : ''}${e.total}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
