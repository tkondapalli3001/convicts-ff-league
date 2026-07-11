'use client'

interface Props {
  title: string
  subtitle: React.ReactNode
  /** Optional gold kicker line above the title, e.g. "THE RECORD BOOK · 7 SEASONS". */
  kicker?: string
}

/**
 * Midnight Prime page header (design artboards 3a / 4a): a full-bleed band with a gold
 * radial wash, an optional gold-dash kicker, a hero-gradient Barlow title, and a tracked
 * sub-line. Rendered first in every page, so it bleeds to the content edges under the navbar.
 */
export default function PageHeader({ title, subtitle, kicker }: Props) {
  return (
    <div
      className="-mx-4 -mt-6 mb-6 overflow-hidden border-b px-4 pb-8 pt-10 sm:px-8 sm:pb-9 sm:pt-12"
      style={{
        borderColor: 'rgba(var(--gold-rgb), 0.12)',
        background:
          'radial-gradient(ellipse 70% 90% at 50% -20%, rgba(var(--gold2-rgb), 0.10) 0%, transparent 60%), #050506',
      }}
    >
      {kicker && (
        <div className="mb-3 flex items-center gap-3 sm:mb-4 sm:gap-4">
          <span
            className="h-px w-8 sm:w-12"
            style={{ background: 'linear-gradient(to right, transparent, #C9962E)' }}
          />
          <span className="text-[9px] font-bold uppercase tracking-[4px] text-gold-soft sm:text-[10px] sm:tracking-[6px]">
            {kicker}
          </span>
        </div>
      )}
      <h1 className="text-hero-gold font-display text-[40px] font-extrabold uppercase leading-[0.95] tracking-[1px] sm:text-[56px] sm:tracking-[2px] lg:text-[64px]">
        {title}
      </h1>
      <p className="mt-3 text-[11px] font-medium uppercase tracking-[1.5px] text-s-text2 sm:text-[12px]">
        {subtitle}
      </p>
    </div>
  )
}
