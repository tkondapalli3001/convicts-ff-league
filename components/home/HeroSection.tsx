import { OWNER_FULL_NAMES } from '@/lib/constants'

interface HeroProps {
  champName: string       // canonical first name (for color lookup)
  champColor: string
  runnerUpName: string
  runnerUpColor: string
  shameName: string
  shameColor: string
  totalSeasons: number
  totalGames: number
  yearRange: string
}

function fullName(name: string): string {
  return OWNER_FULL_NAMES[name] || name
}

export default function HeroSection({
  champName,
  champColor,
  runnerUpName,
  runnerUpColor,
  shameName,
  shameColor,
  totalSeasons,
  totalGames,
  yearRange,
}: HeroProps) {
  return (
    <div
      className="relative overflow-hidden rounded-[20px] border border-s-border p-7 md:p-10 animate-fade-in"
      style={{ background: '#0e1117' }}
    >
      {/* Champion color orb — top-right */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-50%',
          right: '-8%',
          width: '55%',
          paddingBottom: '55%',
          borderRadius: '50%',
          background: `radial-gradient(ellipse, ${champColor}28 0%, transparent 70%)`,
        }}
      />
      {/* Teal orb — bottom-left */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: '-40%',
          left: '-4%',
          width: '40%',
          paddingBottom: '40%',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, #00ceb820 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
        {/* Left — headline */}
        <div className="max-w-xl">
          <div className="text-[10px] font-bold tracking-[4px] uppercase text-s-teal mb-4 flex items-center gap-2">
            <span className="w-4 h-px bg-s-teal inline-block" />
            The Convicts League · {totalSeasons} Seasons · {yearRange}
          </div>

          <h1 className="text-[28px] md:text-[38px] lg:text-[44px] font-black text-s-text leading-[1.1] mb-4 tracking-tight">
            <span className="block text-s-text3 font-semibold text-[13px] md:text-[15px] tracking-[3px] uppercase mb-2">
              Reigning Champion
            </span>
            <span className="relative inline-block" style={{ color: champColor }}>
              {fullName(champName)}
            </span>
          </h1>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-s-text3 font-medium">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-s-teal" />
              {totalGames} matchups
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-s-gold" />
              12 managers
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-s-purple" />
              Live from Sleeper API
            </span>
          </div>
        </div>

        {/* Right — Runner-Up + Toilet Bowl */}
        <div className="flex-shrink-0 flex flex-col gap-3 min-w-[200px]">
          {/* Runner-Up */}
          <div className="rounded-[14px] border border-s-border/50 p-4"
            style={{ background: 'rgba(26,29,35,0.7)' }}>
            <div className="flex items-center gap-3">
              <span className="text-[28px] leading-none flex-shrink-0">🥈</span>
              <div className="min-w-0">
                <div className="text-[9px] font-bold tracking-[2px] uppercase text-s-text3 mb-0.5">
                  Runner-Up
                </div>
                <div
                  className="text-[17px] font-black leading-tight truncate"
                  style={{ color: runnerUpColor !== '#64748b' ? runnerUpColor : '#e6edf3' }}
                >
                  {fullName(runnerUpName)}
                </div>
              </div>
            </div>
          </div>

          {/* Toilet Bowl */}
          <div className="rounded-[14px] border border-s-border/50 p-4"
            style={{ background: 'rgba(26,29,35,0.7)' }}>
            <div className="flex items-center gap-3">
              <span className="text-[28px] leading-none flex-shrink-0">🚽</span>
              <div className="min-w-0">
                <div className="text-[9px] font-bold tracking-[2px] uppercase text-s-text3 mb-0.5">
                  Toilet Bowl Loser
                </div>
                <div
                  className="text-[17px] font-black leading-tight truncate"
                  style={{ color: shameColor !== '#64748b' ? shameColor : '#e6edf3' }}
                >
                  {fullName(shameName)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
