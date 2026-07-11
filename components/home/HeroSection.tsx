import { OWNER_FULL_NAMES } from '@/lib/constants'

interface HeroProps {
  champName: string
  runnerUpName: string
  shameName: string
  /** Season number, e.g. 7 → "Season 7 Champion". */
  seasonCount: number
  /** Latest completed season year, e.g. 2025 → kicker date + ghost "25" numeral. */
  latestYear: number | null
  totalGames: number
  managerCount: number
  yearRange: string
}

function fullName(name: string): string {
  return OWNER_FULL_NAMES[name] || name
}

/**
 * Midnight Prime home hero (design artboards 2a / 2b): gold radial wash, ghost-year
 * numeral, kicker + hero-gradient champion name, rule-diamond divider, meta row, and a
 * bordered Runner-Up / Toilet-Bowl panel (desktop) that collapses to a 2-col band on mobile.
 */
export default function HeroSection({
  champName,
  runnerUpName,
  shameName,
  seasonCount,
  latestYear,
  totalGames,
  managerCount,
  yearRange,
}: HeroProps) {
  const ghost = latestYear ? String(latestYear).slice(-2) : ''

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden border-b px-5 py-9 sm:px-14 sm:pt-16 sm:pb-14"
        style={{
          borderColor: 'rgba(var(--gold-rgb), 0.12)',
          background:
            'radial-gradient(ellipse 90% 90% at 50% -20%, rgba(var(--gold2-rgb), 0.10) 0%, transparent 60%), #050506',
        }}
      >
        {/* Ghost year numeral */}
        {ghost && (
          <div
            aria-hidden
            className="pointer-events-none absolute select-none font-display font-extrabold leading-none"
            style={{
              top: -28,
              right: 'clamp(-12px, 12vw, 260px)',
              fontSize: 'clamp(150px, 26vw, 300px)',
              letterSpacing: 4,
              color: 'rgba(var(--gold2-rgb), 0.045)',
            }}
          >
            {ghost}
          </div>
        )}

        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
          {/* Left — champion headline */}
          <div className="animate-fade-in">
            {/* Kicker */}
            <div className="mb-4 flex items-center gap-3 sm:mb-[22px] sm:gap-4">
              <span
                className="h-px w-8 sm:w-12"
                style={{ background: 'linear-gradient(to right, transparent, #C9962E)' }}
              />
              <span className="text-[9px] font-bold uppercase tracking-[4px] text-gold-soft sm:text-[10px] sm:tracking-[6px]">
                Season {seasonCount} Champion{latestYear ? ` · ${latestYear}` : ''}
              </span>
            </div>

            {/* Champion name */}
            <h1
              className="text-hero-gold animate-gold-pulse font-display font-extrabold uppercase leading-[0.92] tracking-[1px] text-[56px] sm:text-[80px] lg:text-[100px] sm:tracking-[2px]"
            >
              {fullName(champName)}
            </h1>

            {/* Rule-diamond divider */}
            <div className="mt-4 flex items-center gap-2.5 sm:mt-[22px] sm:gap-3.5">
              <span className="h-px w-9 bg-gold sm:w-16" />
              <span className="h-[5px] w-[5px] rotate-45 bg-gold" />
              <span className="h-px w-9 bg-gold sm:w-16" />
            </div>

            {/* Meta row */}
            <div className="mt-3.5 flex flex-wrap items-center gap-x-3.5 gap-y-2 text-[9px] font-semibold uppercase tracking-[1.5px] text-s-text2 sm:mt-5 sm:gap-x-5 sm:text-[11px]">
              <span>{totalGames} Matchups</span>
              <span className="h-[3px] w-[3px] rounded-full bg-gold" />
              <span>{managerCount} Managers</span>
              <span className="h-[3px] w-[3px] rounded-full bg-gold" />
              <span>{yearRange}</span>
            </div>
          </div>

          {/* Right — Runner-Up / Toilet Bowl panel (desktop) */}
          <div
            className="hidden flex-shrink-0 flex-col animate-fade-in-1 lg:flex lg:min-w-[264px]"
            style={{ border: '1px solid rgba(var(--gold-rgb), 0.14)', background: 'rgba(10,10,12,0.7)' }}
          >
            <div
              className="border-b px-[22px] py-4 transition-colors hover:bg-[rgba(201,150,46,0.05)]"
              style={{ borderColor: 'rgba(var(--gold-rgb), 0.10)' }}
            >
              <div className="mb-1.5 text-[9px] font-bold uppercase tracking-[3px] text-gold-dim">
                Runner-Up
              </div>
              <div className="font-display text-[27px] font-bold uppercase leading-none tracking-[1px] text-[#D8D3C8]">
                {runnerUpName}
              </div>
            </div>
            <div className="px-[22px] py-4 transition-colors hover:bg-[rgba(180,90,90,0.05)]">
              <div className="mb-1.5 text-[9px] font-bold uppercase tracking-[3px] text-[#8A4A46]">
                Toilet Bowl Loser
              </div>
              <div className="font-display text-[27px] font-bold uppercase leading-none tracking-[1px] text-loss">
                {shameName}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Runner-Up / Toilet Bowl — mobile 2-col band */}
      <div
        className="grid grid-cols-2 border-b lg:hidden"
        style={{ borderColor: 'rgba(var(--gold-rgb), 0.12)' }}
      >
        <div className="border-r px-[18px] py-3.5" style={{ borderColor: 'rgba(var(--gold-rgb), 0.10)' }}>
          <div className="mb-1 text-[8px] font-bold uppercase tracking-[2.5px] text-gold-dim">Runner-Up</div>
          <div className="font-display text-[22px] font-bold uppercase leading-none text-[#D8D3C8]">
            {runnerUpName}
          </div>
        </div>
        <div className="px-[18px] py-3.5">
          <div className="mb-1 text-[8px] font-bold uppercase tracking-[2.5px] text-[#8A4A46]">Toilet Bowl</div>
          <div className="font-display text-[22px] font-bold uppercase leading-none text-loss">{shameName}</div>
        </div>
      </div>
    </>
  )
}
