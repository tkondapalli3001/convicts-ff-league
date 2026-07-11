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
        // Legacy s- palette — remapped to Midnight Prime so un-migrated pages shift with the theme.
        's-bg':      '#050506',   // onyx base
        's-bg2':     '#070708',   // nav
        's-bg3':     '#0B0B0D',   // card
        's-bg4':     '#121216',   // raised panel
        's-surface':  '#0B0B0D',
        's-border':   '#1e1a12',
        's-border2':  '#2a2418',
        's-text':     '#EDE9E0',  // warm off-white
        's-text2':    '#9AA0AC',
        's-text3':    '#5C6270',
        's-muted':    '#3A4150',
        's-gold':     '#C9962E',
        's-green':    '#7FA886',  // sage win
        's-red':      '#B4636B',  // brick loss
        // Midnight Prime — precise tokens for new chrome + future pages
        'gold':        '#C9962E',
        'gold-soft':   '#C9A24B',
        'gold-dim':    '#8A7439',
        'gold-bright': '#E8CE8A',
        'panel':       'rgba(10,10,12,0.7)',
        'panel-2':     'rgba(10,10,12,0.5)',
        'win':         '#7FA886',
        'loss':        '#B4636B',
      },
      fontFamily: {
        sans: ['var(--font-archivo)', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['var(--font-barlow)', 'Barlow Condensed', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', '"Courier New"', 'monospace'],
      },
      keyframes: {
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          from: { opacity: '0', transform: 'translateX(-24px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        goldPulse: {
          '0%, 100%': { opacity: '0.55' },
          '50%':      { opacity: '1' },
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
        'slide-in-left': 'slideInLeft 0.22s ease-out both',
        'gold-pulse': 'goldPulse 5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config
