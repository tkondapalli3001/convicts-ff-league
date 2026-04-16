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
        // Sleeper dark theme palette (s- prefix = sleeper)
        's-bg':      '#080c14',
        's-bg2':     '#0d1219',
        's-bg3':     '#111827',
        's-bg4':     '#1a2234',
        's-border':  '#1e2d45',
        's-border2': '#243552',
        's-text':    '#e2e8f0',
        's-text2':   '#94a3b8',
        's-text3':   '#475569',
        's-gold':    '#f59e0b',
        's-gold2':   '#fbbf24',
        's-green':   '#22c55e',
        's-red':     '#ef4444',
        's-blue':    '#60a5fa',
        's-purple':  '#a78bfa',
      },
      keyframes: {
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fadeInUp 0.3s ease forwards',
      },
    },
  },
  plugins: [],
}

export default config
