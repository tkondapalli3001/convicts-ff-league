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
        // Deep-space dark palette (s- prefix = sleeper)
        's-bg':          '#0e1117',
        's-bg2':         '#161b22',
        's-bg3':         '#1c2128',
        's-bg4':         '#22272e',
        's-surface':     '#1a1d23',
        's-border':      '#2d333b',
        's-border2':     '#3d444d',
        's-text':        '#e6edf3',
        's-text2':       '#8b949e',
        's-text3':       '#6e7681',
        's-muted':       '#484f58',
        's-gold':        '#f59e0b',
        's-gold2':       '#fbbf24',
        's-green':       '#2ea043',
        's-red':         '#f85149',
        's-blue':        '#58a6ff',
        's-purple':      '#a371f7',
        's-teal':        '#00ceb8',
        's-rose':        '#ff395c',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      keyframes: {
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in':   'fadeInUp 0.5s ease both',
        'fade-in-1': 'fadeInUp 0.5s 0.06s ease both',
        'fade-in-2': 'fadeInUp 0.5s 0.12s ease both',
        'fade-in-3': 'fadeInUp 0.5s 0.18s ease both',
        'fade-in-4': 'fadeInUp 0.5s 0.24s ease both',
        'fade-in-5': 'fadeInUp 0.5s 0.30s ease both',
        'fade-in-6': 'fadeInUp 0.5s 0.36s ease both',
      },
    },
  },
  plugins: [],
}

export default config
