'use client'

import React, { useState } from 'react'
import { useLeague } from '@/context/LeagueContext'
import { ownerColor, fullNameInitials } from '@/lib/utils'

interface Props {
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZES: Record<string, { box: string; text: string }> = {
  sm: { box: 'w-8 h-8',   text: 'text-[11px]' },
  md: { box: 'w-11 h-11', text: 'text-[15px]' },
  lg: { box: 'w-14 h-14', text: 'text-[19px]' },
}

export default function OwnerAvatar({ name, size = 'md', className = '' }: Props) {
  const { state } = useLeague()
  const [imgError, setImgError] = useState(false)
  const color = ownerColor(name)
  const initials = fullNameInitials(name)
  const avatarUrl = state.ownerAvatarMap?.[name]
  const { box, text } = SIZES[size]

  if (avatarUrl && !imgError) {
    return (
      <div
        className={`rounded-full flex-shrink-0 overflow-hidden ${box} ${className}`}
        style={{
          boxShadow: `0 0 0 2px #050506, 0 0 14px ${color}40`,
        }}
      >
        <img
          src={avatarUrl}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      </div>
    )
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center font-extrabold flex-shrink-0 ${box} ${text} ${className}`}
      style={{
        background: `linear-gradient(135deg, ${color} 0%, ${color}88 100%)`,
        color: '#ffffff',
        boxShadow: `0 0 0 2px #050506, 0 0 14px ${color}40`,
        letterSpacing: '-0.02em',
      }}
    >
      {initials}
    </div>
  )
}
