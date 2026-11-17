'use client'

interface Props {
  title: string
  subtitle?: React.ReactNode
  /** Optional gold kicker line above the title, e.g. "THE RECORD BOOK · 7 SEASONS". */
  kicker?: string
  /** Sits at the far end of the kicker line (the season tab's sync readout). */
  aside?: React.ReactNode
}

/**
 * Midnight Prime page header (design artboards 3a / 4a): a full-bleed band with a gold
 * radial wash, an optional gold-dash kicker, a hero-gradient Barlow title, and a tracked
 * sub-line. Rendered first in every page, so it bleeds to the content edges under the navbar.
 */
export default function PageHeader({ title, subtitle, kicker, aside }: Props) {
  return (
    <div
      className="-mx-4 -mt-6 mb-3 overflow-hidden border-b px-4 pb-4 pt-5 sm:mb-6 sm:px-8 sm:pb-9 sm:pt-12"
      style={{
        borderColor: 'rgba(var(--gold-rgb), 0.12)',
        background:
          'radial-gradient(ellipse 70% 90% at 50% -20%, rgba(var(--gold2-rgb), 0.10) 0%, transparent 60%), #050506',
      }}
    >
      {kicker && (
        <div className="mb-2 flex items-center gap-3 sm:mb-4 sm:gap-4">
          <span
            className="h-px w-8 sm:w-12"
            style={{ background: 'linear-gradient(to right, transparent, #C9962E)' }}
          />
          <span className={`whitespace-nowrap text-[9px] font-bold uppercase text-gold-soft sm:text-[10px] sm:tracking-[6px] ${aside ? 'tracking-[2.5px]' : 'tracking-[4px]'}`}>
            {kicker}
          </span>
          {aside && <span className="ml-auto flex-shrink-0">{aside}</span>}
        </div>
      )}
      <h1 className="text-hero-gold font-display text-[32px] font-extrabold uppercase leading-[0.95] tracking-[1px] sm:text-[56px] sm:tracking-[2px] lg:text-[64px]">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-3 hidden text-[12px] font-medium uppercase tracking-[1.5px] text-s-text2 sm:block">
          {subtitle}
        </p>
      )}
    </div>
  )
}
