import { ownerColor, avatarLetters } from '@/lib/utils'

interface Props {
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZES = {
  sm: 'w-8 h-8 text-[12px]',
  md: 'w-11 h-11 text-[16px]',
  lg: 'w-14 h-14 text-[20px]',
}

export default function OwnerAvatar({ name, size = 'md', className = '' }: Props) {
  const color = ownerColor(name)
  return (
    <div
      className={`rounded-full flex items-center justify-center font-extrabold flex-shrink-0 ${SIZES[size]} ${className}`}
      style={{ background: `${color}22`, color }}
    >
      {avatarLetters(name)}
    </div>
  )
}
