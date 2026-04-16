interface Props {
  emoji: string
  owner: string
  title: string
  color: string
  body: string
}

export default function TrashTalkCard({ emoji, owner, title, color, body }: Props) {
  return (
    <div
      className="bg-s-bg2 border border-s-border rounded-[12px] p-[18px] mb-3 animate-fade-in"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <div className="flex gap-3 items-start">
        <div className="text-[30px] flex-shrink-0">{emoji}</div>
        <div>
          <div className="text-[14px] font-extrabold text-s-text mb-[6px]">
            {owner} — {title}
          </div>
          <div className="text-[13px] text-s-text2 leading-[1.65]">{body}</div>
        </div>
      </div>
    </div>
  )
}
