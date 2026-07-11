import OwnerAvatar from '@/components/shared/OwnerAvatar'

interface Props {
  /** Legacy emoji prop — retained for call-site compatibility; no longer rendered. */
  emoji?: string
  owner: string
  title: string
  /** Owner identity colour — retained for compatibility; the avatar uses a gold ring. */
  color?: string
  body: string
}

/**
 * Midnight Prime trash-talk card (design 3a): gold-ringed avatar, Barlow gold-bright owner
 * name, and stat-grounded roast copy. Rendered in a 2-col grid on the Records page.
 */
export default function TrashTalkCard({ owner, title, body }: Props) {
  return (
    <div
      className="overflow-hidden rounded-[6px] animate-fade-in"
      style={{ background: '#0B0B0D', border: '1px solid rgba(var(--gold-rgb), 0.12)' }}
    >
      <div className="flex items-start gap-4 p-5">
        <div
          className="flex-shrink-0 rounded-full"
          style={{ boxShadow: '0 0 0 1.5px #C9962E, 0 0 10px rgba(201,150,46,0.35)' }}
        >
          <OwnerAvatar name={owner} size="md" />
        </div>
        <div className="min-w-0">
          <div className="font-display text-[22px] font-bold uppercase leading-none tracking-[0.5px] text-gold-bright">
            {owner}
          </div>
          {title && (
            <div className="mt-1 text-[10px] font-bold uppercase tracking-[2px] text-gold-dim">{title}</div>
          )}
          <div className="mt-2.5 text-[12px] leading-[1.6] text-s-text2">{body}</div>
        </div>
      </div>
    </div>
  )
}
