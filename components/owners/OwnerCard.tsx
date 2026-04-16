import Link from 'next/link'
import { OwnerSeason } from '@/types'
import { ownerColor, avatarLetters } from '@/lib/utils'
import { MANUAL_CHAMPS, MANUAL_SHAME, EARNINGS_DATA } from '@/lib/constants'

interface Props {
  name: string
  seasons: OwnerSeason[]
}

export default function OwnerCard({ name, seasons }: Props) {
  const totalW = seasons.reduce((a, s) => a + s.wins, 0)
  const totalL = seasons.reduce((a, s) => a + s.losses, 0)
  const pct = Math.round(totalW / (totalW + totalL || 1) * 100)
  const col = ownerColor(name)
  const champs = MANUAL_CHAMPS.filter(c => c.winner?.includes(name))
    .reduce((sum, c) => sum + (c.half ? 0.5 : 1), 0)
  const shame = MANUAL_SHAME.filter(s => s.loser === name).length
  const earn = EARNINGS_DATA.find(e => e.owner === name)

  return (
    <Link href={`/owners/${encodeURIComponent(name)}`}>
      <div className="bg-s-bg3 border border-s-border rounded-[10px] p-[14px] text-center cursor-pointer transition-all duration-150 hover:border-s-gold hover:bg-s-bg4">
        {/* Avatar */}
        <div
          className="w-11 h-11 rounded-full mx-auto mb-[10px] flex items-center justify-center text-[16px] font-extrabold"
          style={{ background: `${col}22`, color: col }}
        >
          {avatarLetters(name)}
        </div>

        {/* Name & record */}
        <div className="text-[13px] font-bold text-s-text">{name}</div>
        <div className="text-[10px] text-s-text3 mt-[3px]">{totalW}W-{totalL}L · {pct}%</div>

        {/* Badges */}
        <div className="flex flex-wrap justify-center gap-1 mt-[6px]">
          {champs > 0 && (
            <span className="inline-flex items-center px-2 py-[2px] rounded-full text-[10px] font-bold bg-[#3d2000] text-s-gold border border-[#5a3200]">
              🏆 {champs}x
            </span>
          )}
          {shame > 0 && (
            <span className="inline-flex items-center px-2 py-[2px] rounded-full text-[10px] font-bold bg-[#3d0000] text-s-red border border-[#5a0000]">
              🚽 {shame}x
            </span>
          )}
          {earn && (
            <span className={`inline-flex items-center px-2 py-[2px] rounded-full text-[10px] font-bold border ${earn.total >= 0 ? 'bg-[#002d10] text-s-green border-[#004d1a]' : 'bg-[#3d0000] text-s-red border-[#5a0000]'}`}>
              {earn.total >= 0 ? '+' : ''}${earn.total}
            </span>
          )}
        </div>

        {/* Win bar */}
        <div className="h-1 rounded-full bg-s-bg4 overflow-hidden mt-[6px]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#065f46] to-s-green"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </Link>
  )
}
