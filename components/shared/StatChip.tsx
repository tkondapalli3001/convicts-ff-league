'use client'

export default function StatChip({
  label,
  value,
  sub,
  accent,
  animClass,
}: {
  label: string
  value: string | number
  sub?: string
  accent?: string
  animClass?: string
}) {
  return (
    <div className={`bento-card relative p-5 flex flex-col gap-1 ${animClass ?? ''}`}>
      {accent && (
        <div
          className="absolute pointer-events-none"
          style={{
            top: -32, right: -32,
            width: 110, height: 110,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${accent}28 0%, transparent 70%)`,
          }}
        />
      )}
      <div className="text-[9px] font-bold tracking-[3px] uppercase text-s-text3 mb-1">{label}</div>
      <div
        className="text-[28px] md:text-[32px] font-black leading-none tracking-tight"
        style={accent ? { color: accent } : { color: '#e6edf3' }}
      >
        {value}
      </div>
      {sub && <div className="text-[11px] text-s-text2 font-medium mt-0.5">{sub}</div>}
    </div>
  )
}
