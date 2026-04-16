interface Props {
  icon: string
  label: string
  value: string | number
  context: string
}

export default function RecordItem({ icon, label, value, context }: Props) {
  return (
    <div className="flex items-start gap-[14px] p-[14px] bg-s-bg3 border border-s-border rounded-[10px] mb-2">
      <div className="text-[26px] flex-shrink-0 leading-none">{icon}</div>
      <div>
        <div className="text-[10px] text-s-text3 uppercase tracking-[1px]">{label}</div>
        <div className="text-[20px] font-extrabold text-s-gold my-[3px] leading-none">{value}</div>
        <div className="text-[11px] text-s-text3">{context}</div>
      </div>
    </div>
  )
}
