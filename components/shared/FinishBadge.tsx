interface Props {
  finish: number | null | undefined
}

export default function FinishBadge({ finish }: Props) {
  if (finish === 1)
    return <span className="inline-flex items-center px-2 py-[2px] rounded-full text-[10px] font-bold bg-[#3d2000] text-s-gold border border-[#5a3200]">🏆 1st</span>
  if (finish === 2)
    return <span className="inline-flex items-center px-2 py-[2px] rounded-full text-[10px] font-bold bg-[#001a3d] text-s-blue border border-[#002d5a]">2nd</span>
  if (finish === 3)
    return <span className="inline-flex items-center px-2 py-[2px] rounded-full text-[10px] font-bold bg-s-bg4 text-s-text2 border border-s-border">3rd</span>
  if (finish)
    return <span className="inline-flex items-center px-2 py-[2px] rounded-full text-[10px] font-bold bg-s-bg4 text-s-text2 border border-s-border">{finish}th</span>
  return <span className="inline-flex items-center px-2 py-[2px] rounded-full text-[10px] font-bold bg-s-bg4 text-s-text3 border border-s-border">—</span>
}
