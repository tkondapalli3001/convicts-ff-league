'use client'

import { useLeague } from '@/context/LeagueContext'

function FinishDot({ finish, year, totalTeams }: { finish: number | null | undefined; year: number; totalTeams: number }) {
  if (finish == null)
    return <span className="w-[30px] h-[30px] rounded-[6px] inline-flex items-center justify-center text-[9px] font-bold bg-s-bg3 text-s-text3 flex-shrink-0">–</span>
  if (finish === 1)
    return <span className="w-[30px] h-[30px] rounded-[6px] inline-flex items-center justify-center text-[11px] font-extrabold bg-[#3d2000] text-s-gold flex-shrink-0" title={`${year}: 🏆 Champ`}>1</span>
  if (finish === 2)
    return <span className="w-[30px] h-[30px] rounded-[6px] inline-flex items-center justify-center text-[11px] font-extrabold bg-[#001a40] text-[#93c5fd] flex-shrink-0" title={`${year}: 2nd`}>2</span>
  if (finish === 3)
    return <span className="w-[30px] h-[30px] rounded-[6px] inline-flex items-center justify-center text-[11px] font-extrabold bg-[#001a40] text-[#7dd3fc] flex-shrink-0" title={`${year}: 3rd`}>3</span>
  if (finish >= totalTeams)
    return <span className="w-[30px] h-[30px] rounded-[6px] inline-flex items-center justify-center text-[11px] font-extrabold bg-[#3d0000] text-[#f87171] flex-shrink-0" title={`${year}: 🚽 Last`}>{finish}</span>
  if (finish <= Math.floor(totalTeams / 2))
    return <span className="w-[30px] h-[30px] rounded-[6px] inline-flex items-center justify-center text-[11px] font-extrabold bg-s-bg4 text-s-text2 flex-shrink-0" title={`${year}: ${finish}th`}>{finish}</span>
  return <span className="w-[30px] h-[30px] rounded-[6px] inline-flex items-center justify-center text-[11px] font-extrabold bg-[#15202b] text-s-text2 flex-shrink-0" title={`${year}: ${finish}th`}>{finish}</span>
}

export default function FinishTracker() {
  const { state } = useLeague()
  const { ownerSeasons, years, leagues } = state

  const LEGEND = [
    { label: 'Champ', className: 'bg-[#3d2000] text-s-gold' },
    { label: '2nd',   className: 'bg-[#001a40] text-[#93c5fd]' },
    { label: '3rd',   className: 'bg-[#001a40] text-[#7dd3fc]' },
    { label: 'Mid',   className: 'bg-s-bg4 text-s-text2' },
    { label: 'Low',   className: 'bg-[#15202b] text-s-text3' },
    { label: 'Last',  className: 'bg-[#3d0000] text-[#f87171]' },
  ]

  return (
    <div className="bg-s-bg2 border border-s-border rounded-[12px] p-[18px] mb-4">
      <div className="text-[10px] font-bold tracking-[2.5px] uppercase text-s-text3 mb-3">
        Finish Position by Year — 1=Champion · Last=Toilet Bowl
      </div>

      {/* Legend */}
      <div className="flex gap-[8px] flex-wrap mb-3">
        {LEGEND.map(({ label, className }) => (
          <span key={label} className="flex items-center gap-1 text-[10px] text-s-text3">
            <span className={`w-[18px] h-[18px] rounded-[4px] inline-flex items-center justify-center text-[9px] font-bold ${className}`}>
              {label[0]}
            </span>
            {label}
          </span>
        ))}
      </div>

      {/* Year headers */}
      <div className="flex items-center mb-1" style={{ paddingLeft: 78 }}>
        {years.map(y => (
          <span key={y} className="w-[34px] text-[10px] text-s-text3 text-center flex-shrink-0">{y}</span>
        ))}
      </div>

      {/* Rows */}
      {Object.entries(ownerSeasons).map(([name, seasons]) => {
        const finishByYear: Record<number, number | null> = {}
        seasons.forEach(s => { finishByYear[s.year] = s.finish })
        return (
          <div key={name} className="flex items-center gap-1 my-1">
            <div className="w-[70px] text-[11px] text-s-text font-semibold flex-shrink-0 text-right pr-2">{name}</div>
            <div className="flex gap-1 flex-wrap">
              {years.map(y => {
                const totalTeams = leagues[y]?.settings?.num_teams || 10
                return (
                  <FinishDot key={y} finish={finishByYear[y]} year={y} totalTeams={totalTeams} />
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
