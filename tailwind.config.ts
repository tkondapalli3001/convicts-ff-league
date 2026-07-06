import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './context/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Legacy dark palette (s- prefix = sleeper) — kept for backward compat
        's-bg':      '#020617',   // upgraded to deep space
        's-bg2':     '#0d1117',
        's-bg3':     '#161b22',
        's-bg4':     '#1e2739',
        's-surface':  '#1a1d23',
        's-border':   '#2d333b',
        's-border2':  '#3d444d',
        's-text':     '#e2e8f0',
        's-text2':    '#94a3b8',
        's-text3':    '#64748b',
        's-muted':    '#475569',
        's-gold':     '#f59e0b',
        's-gold2':    '#fbbf24',
        's-green':    '#22c55e',
        's-red':      '#ef4444',
        's-blue':     '#3b82f6',
        's-purple':   '#8b5cf6',
        's-teal':     '#14b8a6',
        's-rose':     '#f43f5e',
        // Nebula accent palette
        'n-bg':      '#020617',   // Deep Space
        'n-violet':  '#8B5CF6',   // Electric Violet
        'n-blue':    '#3B82F6',   // Sleeper Blue
        'n-surface': 'rgba(15,23,42,0.4)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', '"Courier New"', 'monospace'],
      },
      keyframes: {
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.6' },
          '50%':      { opacity: '1' },
        },
        shimmer: {
          from: { backgroundPosition: '-200% 0' },
          to:   { backgroundPosition: '200% 0' },
        },
        slideInLeft: {
          from: { opacity: '0', transform: 'translateX(-24px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-in':    'fadeInUp 0.5s ease both',
        'fade-in-1':  'fadeInUp 0.5s 0.06s ease both',
        'fade-in-2':  'fadeInUp 0.5s 0.12s ease both',
        'fade-in-3':  'fadeInUp 0.5s 0.18s ease both',
        'fade-in-4':  'fadeInUp 0.5s 0.24s ease both',
        'fade-in-5':  'fadeInUp 0.5s 0.30s ease both',
        'fade-in-6':  'fadeInUp 0.5s 0.36s ease both',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'shimmer':    'shimmer 2s linear infinite',
        'slide-in-left': 'slideInLeft 0.22s ease-out both',
      },
      backgroundSize: {
        '200': '200% 100%',
      },
    },
  },
  plugins: [],
}

export default config
