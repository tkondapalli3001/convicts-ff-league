import type { LuckEntry } from '@/lib/luck'
import OwnerAvatar from '@/components/shared/OwnerAvatar'

interface Props {
  entries: LuckEntry[]
  year: number
}

function NarrativeBadge({ narrative }: { narrative: LuckEntry['narrative'] }) {
  if (narrative === 'The League Martyr') {
    return (
      <span className="inline-block px-2 py-[3px] rounded-full text-[10px] font-bold border bg-[#3d0000] text-red-400 border-[#5a0000] whitespace-nowrap">
        ☠ The League Martyr
      </span>
    )
  }
  if (narrative === 'Lucky') {
    return (
      <span className="inline-block px-2 py-[3px] rounded-full text-[10px] font-bold border bg-[#002d1a] text-green-400 border-[#005a30] whitespace-nowrap">
        🍀 Lucky
      </span>
    )
  }
  return <span className="text-s-text3">—</span>
}

function luckColor(val: number): string {
  if (val > 0) return 'text-green-400'
  if (val < 0) return 'text-red-400'
  return 'text-[#8b949e]'
}

function fmt(n: number, decimals = 2): string {
  return n.toFixed(decimals)
}

export default function LuckTable({ entries, year }: Props) {
  return (
    <div className="gl p-[18px] relative overflow-hidden">
      <div className="bento-fill" style={{ background: 'rgba(20,184,166,0.15)' }} />
      <p className="text-[10px] font-bold tracking-[3px] uppercase text-slate-400 mb-3 relative z-10">
        All-Play Luck Rankings — {year} Season
      </p>
      <div className="overflow-x-auto">
        <table className="min-w-[620px] w-full border-collapse text-[12px]">
          <thead>
            <tr>
              <th className="text-left w-8">#</th>
              <th className="text-left">Manager</th>
              <th className="text-right whitespace-nowrap">Actual W</th>
              <th className="text-right whitespace-nowrap">Expected W</th>
              <th className="text-right whitespace-nowrap">Luck Index</th>
              <th className="text-left">Narrative</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, i) => (
              <tr
                key={entry.owner}
                className="border-b border-s-border last:border-0 hover:bg-s-bg3 transition-colors duration-100"
              >
                <td className="py-[10px] pr-3 text-s-text3 font-bold num">{i + 1}</td>
                <td className="py-[10px] pr-3">
                  <div className="flex items-center gap-2">
                    <OwnerAvatar name={entry.owner} size="sm" />
                    <span className="text-s-text font-semibold whitespace-nowrap">{entry.owner}</span>
                  </div>
                </td>
                <td className="py-[10px] pr-3 text-right text-s-text font-semibold num">
                  {entry.actualWins}
                </td>
                <td className="py-[10px] pr-3 text-right text-s-text2 num">
                  {fmt(entry.expectedWins)}
                </td>
                <td className={`py-[10px] pr-3 text-right font-bold num ${luckColor(entry.luckIndex)}`}>
                  {entry.luckIndex > 0 ? '+' : ''}{fmt(entry.luckIndex)}
                </td>
                <td className="py-[10px]">
                  <NarrativeBadge narrative={entry.narrative} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-[10px] text-s-text3 leading-relaxed">
        <strong className="text-s-text2">Luck Index</strong> = Actual Wins − All-Play Expected Wins.
        Each week, a team&apos;s score is compared against every other team. Expected wins for that week = wins / (teams − 1).
        Summed across all regular-season weeks. Positive = lucky, negative = unlucky.
      </p>
    </div>
  )
}
