'use client'

import { useState } from 'react'

export type GradientColor = 'blue' | 'purple' | 'teal' | 'gold' | 'rose' | 'green'

export interface BentoConfig {
  bg: string
  border: string
  glow: string
  glowHover: string
  iconBg: string
  accent: string
}

export const BENTO_CONFIGS: Record<GradientColor, BentoConfig> = {
  purple: {
    bg: 'linear-gradient(135deg, rgba(139,92,246,0.14) 0%, rgba(109,40,217,0.04) 100%)',
    border: 'rgba(139,92,246,0.28)',
    glow: '0 2px 24px rgba(139,92,246,0.10)',
    glowHover: '0 8px 40px rgba(139,92,246,0.32), 0 2px 16px rgba(139,92,246,0.16)',
    iconBg: 'rgba(139,92,246,0.13)',
    accent: '#8b5cf6',
  },
  blue: {
    bg: 'linear-gradient(135deg, rgba(59,130,246,0.13) 0%, rgba(37,99,235,0.03) 100%)',
    border: 'rgba(59,130,246,0.25)',
    glow: '0 2px 24px rgba(59,130,246,0.08)',
    glowHover: '0 8px 40px rgba(59,130,246,0.28), 0 2px 16px rgba(59,130,246,0.13)',
    iconBg: 'rgba(59,130,246,0.13)',
    accent: '#3b82f6',
  },
  teal: {
    bg: 'linear-gradient(135deg, rgba(20,184,166,0.13) 0%, rgba(13,148,136,0.03) 100%)',
    border: 'rgba(20,184,166,0.25)',
    glow: '0 2px 24px rgba(20,184,166,0.08)',
    glowHover: '0 8px 40px rgba(20,184,166,0.28), 0 2px 16px rgba(20,184,166,0.13)',
    iconBg: 'rgba(20,184,166,0.13)',
    accent: '#14b8a6',
  },
  gold: {
    bg: 'linear-gradient(135deg, rgba(245,158,11,0.13) 0%, rgba(217,119,6,0.03) 100%)',
    border: 'rgba(245,158,11,0.25)',
    glow: '0 2px 24px rgba(245,158,11,0.08)',
    glowHover: '0 8px 40px rgba(245,158,11,0.28), 0 2px 16px rgba(245,158,11,0.13)',
    iconBg: 'rgba(245,158,11,0.13)',
    accent: '#f59e0b',
  },
  rose: {
    bg: 'linear-gradient(135deg, rgba(244,63,94,0.13) 0%, rgba(225,29,72,0.03) 100%)',
    border: 'rgba(244,63,94,0.25)',
    glow: '0 2px 24px rgba(244,63,94,0.08)',
    glowHover: '0 8px 40px rgba(244,63,94,0.28), 0 2px 16px rgba(244,63,94,0.13)',
    iconBg: 'rgba(244,63,94,0.13)',
    accent: '#f43f5e',
  },
  green: {
    bg: 'linear-gradient(135deg, rgba(34,197,94,0.12) 0%, rgba(22,163,74,0.03) 100%)',
    border: 'rgba(34,197,94,0.25)',
    glow: '0 2px 24px rgba(34,197,94,0.08)',
    glowHover: '0 8px 40px rgba(34,197,94,0.28), 0 2px 16px rgba(34,197,94,0.13)',
    iconBg: 'rgba(34,197,94,0.13)',
    accent: '#22c55e',
  },
}

export interface BentoCardProps {
  gradientColor: GradientColor
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export default function BentoCard({ gradientColor, children, className = '', onClick }: BentoCardProps) {
  const [hovered, setHovered] = useState(false)
  const cfg = BENTO_CONFIGS[gradientColor]

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={[
        'relative rounded-2xl overflow-hidden',
        'transition-all duration-300 ease-out',
        onClick ? 'cursor-pointer' : '',
        hovered ? 'scale-[1.02]' : 'scale-100',
        className,
      ].filter(Boolean).join(' ')}
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        boxShadow: hovered ? cfg.glowHover : cfg.glow,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      {/* Radial bloom — top-left corner */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse 80% 50% at -10% -10%, ${cfg.iconBg}, transparent)` }}
      />
      {/* Hover-activated reverse-angle layer — creates "gradient shift" feel */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-500"
        style={{
          background: `linear-gradient(225deg, ${cfg.iconBg}, transparent 65%)`,
          opacity: hovered ? 1 : 0,
        }}
      />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  )
}
