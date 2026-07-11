'use client'

interface Props {
  title: string
  /** Optional right-aligned header content (e.g. "Top 5 all-time" hint). */
  action?: React.ReactNode
  /** Brick (shame) variant — brick border, dash and heading instead of gold. */
  brick?: boolean
  className?: string
  children: React.ReactNode
}

/**
 * Midnight Prime section card (design 2a/3a/4a): onyx panel, gold (or brick) hairline,
 * and a header row with a short dash + uppercase tracked heading. The shared shell behind
 * records groups, HOF/shame lists, owner-profile panels, etc.
 */
export default function SectionCard({ title, action, brick, className, children }: Props) {
  const border = brick ? 'rgba(180,90,90,0.16)' : 'rgba(var(--gold-rgb), 0.14)'
  const headBorder = brick ? 'rgba(180,90,90,0.20)' : 'rgba(var(--gold-rgb), 0.16)'
  const dash = brick ? '#8A4A46' : '#C9962E'

  return (
    <div
      className={`overflow-hidden rounded-[6px] ${className ?? ''}`}
      style={{ background: '#0B0B0D', border: `1px solid ${border}` }}
    >
      <div
        className="flex items-center justify-between gap-3 border-b px-5 pb-3 pt-[18px]"
        style={{ borderColor: headBorder }}
      >
        <div className="flex items-center gap-2.5">
          <span className="h-px w-5 flex-shrink-0" style={{ background: dash }} />
          <div className={`text-[11px] font-bold uppercase tracking-[4px] ${brick ? 'text-loss' : 'text-gold-soft'}`}>
            {title}
          </div>
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
      {children}
    </div>
  )
}
