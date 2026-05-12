interface HeroProps {
  highScore: number
  highScoreOwner: string
  highScoreOwnerColor: string
  champName: string
  champColor: string
  totalSeasons: number
  totalGames: number
  yearRange: string
}

export default function HeroSection({
  highScore,
  highScoreOwner,
  highScoreOwnerColor,
  champName,
  champColor,
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

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
        {/* Left — headline */}
        <div className="max-w-2xl">
          <div className="text-[10px] font-bold tracking-[4px] uppercase text-s-teal mb-4 flex items-center gap-2">
            <span className="w-4 h-px bg-s-teal inline-block" />
            The Convicts League · {totalSeasons} Seasons · {yearRange}
          </div>

          <h1 className="text-[28px] md:text-[38px] lg:text-[44px] font-black text-s-text leading-[1.1] mb-4 tracking-tight">
            <span className="block text-s-text3 font-semibold text-[13px] md:text-[15px] tracking-[3px] uppercase mb-2">
              Reigning Champion
            </span>
            <span
              className="relative inline-block"
              style={{ color: champColor }}
            >
              {champName}
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

        {/* Right — all-time high score */}
        <div className="flex-shrink-0 lg:text-right">
          <div className="text-[9px] font-bold tracking-[4px] uppercase text-s-text3 mb-2">
            All-Time High Score
          </div>
          <div
            className="text-[56px] md:text-[72px] font-black leading-none tabular-nums tracking-tight"
            style={{
              background: 'linear-gradient(135deg, #00ceb8 0%, #f59e0b 55%, #ff395c 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {highScore > 0 ? highScore.toFixed(2) : '—'}
          </div>
          {highScoreOwner && (
            <div className="text-[11px] text-s-text3 mt-2 font-medium">
              by{' '}
              <span className="font-bold" style={{ color: highScoreOwnerColor }}>
                {highScoreOwner}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
