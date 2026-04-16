interface Props {
  label: string
  value: string | number
  sub?: string
  valueColor?: string
}

export default function StatBox({ label, value, sub, valueColor }: Props) {
  return (
    <div className="bg-s-bg3 border border-s-border rounded-[10px] p-[14px]">
      <div className="text-[10px] text-s-text3 tracking-[1px] uppercase mb-[5px]">{label}</div>
      <div
        className="text-[22px] font-extrabold leading-none"
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </div>
      {sub && <div className="text-[11px] text-s-text3 mt-1">{sub}</div>}
    </div>
  )
}
