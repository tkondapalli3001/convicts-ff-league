// Midnight Prime brand lockup — monogram + wordmark. Shared by Navbar and MobileMenu.

interface BrandProps {
  /** 'sm' = compact mobile lockup (26px monogram); default = desktop (32px). */
  size?: 'sm' | 'md'
}

export default function Brand({ size = 'md' }: BrandProps) {
  const sm = size === 'sm'
  const box = sm ? 26 : 32
  const monoFont = sm ? 15 : 19
  const wordSize = sm ? 'text-[10px] tracking-[4px]' : 'text-[12px] tracking-[5px]'

  return (
    <div className="flex items-center gap-3">
      {/* Monogram — gold-bordered square with inset hairline + metal "C" */}
      <div
        className="relative flex items-center justify-center flex-shrink-0 border border-gold"
        style={{ width: box, height: box }}
      >
        <span
          className="absolute inset-[2px] border"
          style={{ borderColor: 'rgba(var(--gold2-rgb), 0.35)' }}
        />
        <span
          className="text-metal font-display font-bold leading-none"
          style={{ fontSize: monoFont }}
        >
          C
        </span>
      </div>

      {/* Wordmark */}
      <span
        className={`text-metal font-bold uppercase leading-none whitespace-nowrap ${wordSize}`}
      >
        Convicts FF
      </span>
    </div>
  )
}
