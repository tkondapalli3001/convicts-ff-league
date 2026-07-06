'use client'

import { useState } from 'react'
import { POS_COLORS } from '@/lib/constants'

interface Props {
  playerId: string
  position: string
  /** Box size in px. */
  size?: number
  className?: string
}

/**
 * NFL player headshot from the Sleeper CDN, falling back to the classic
 * position-colored badge when no photo exists (retired players, odd IDs).
 * DEF "players" have team-abbreviation IDs and get the team logo instead.
 */
export default function PlayerHeadshot({ playerId, position, size = 32, className = '' }: Props) {
  const [imgError, setImgError] = useState(false)
  const posColor = POS_COLORS[position] ?? '#6e7681'
  const isDef = position === 'DEF'
  const radius = size >= 40 ? 'rounded-xl' : 'rounded-lg'
  const frame = { width: size, height: size, background: `${posColor}22`, border: `1px solid ${posColor}40` }

  if (imgError || !playerId) {
    return (
      <div
        className={`flex-shrink-0 flex items-center justify-center font-black ${radius} ${className}`}
        style={{ ...frame, color: posColor, fontSize: Math.max(9, Math.round(size * 0.28)) }}
      >
        {position}
      </div>
    )
  }

  const src = isDef
    ? `https://sleepercdn.com/images/team_logos/nfl/${playerId.toLowerCase()}.png`
    : `https://sleepercdn.com/content/nfl/players/thumb/${playerId}.jpg`

  return (
    <div className={`flex-shrink-0 overflow-hidden ${radius} ${className}`} style={frame}>
      <img
        src={src}
        alt=""
        loading="lazy"
        className={`w-full h-full ${isDef ? 'object-contain p-0.5' : 'object-cover object-top'}`}
        onError={() => setImgError(true)}
      />
    </div>
  )
}
