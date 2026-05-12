interface Props {
  finish: number | null | undefined
}

export default function FinishBadge({ finish }: Props) {
  if (finish === 1)
    return (
      <span className="inline-flex items-center gap-[3px] px-2 py-[2px] rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/25">
        🏆 1st
      </span>
    )
  if (finish === 2)
    return (
      <span className="inline-flex items-center px-2 py-[2px] rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/25">
        2nd
      </span>
    )
  if (finish === 3)
    return (
      <span className="inline-flex items-center px-2 py-[2px] rounded-full text-[10px] font-bold bg-violet-500/10 text-violet-400 border border-violet-500/25">
        3rd
      </span>
    )
  if (finish)
    return (
      <span className="inline-flex items-center px-2 py-[2px] rounded-full text-[10px] font-bold bg-white/5 text-slate-400 border border-white/10">
        {finish}th
      </span>
    )
  return (
    <span className="inline-flex items-center px-2 py-[2px] rounded-full text-[10px] font-bold bg-white/5 text-slate-600 border border-white/10">
      —
    </span>
  )
}
