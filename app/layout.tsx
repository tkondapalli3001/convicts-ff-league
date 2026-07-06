import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { LeagueProvider } from '@/context/LeagueContext'
import Navbar from '@/components/layout/Navbar'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800', '900'],
})

const SITE_URL = 'https://tkondapalli3001.github.io/convicts-ff-league'
const DESCRIPTION =
  'The Convicts League — 7 seasons of fantasy football history, records, earnings, matchup previews & trash talk. Live from the Sleeper API.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Convicts FF League',
  description: DESCRIPTION,
  manifest: '/convicts-ff-league/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'Convicts FF',
    statusBarStyle: 'black-translucent',
  },
  openGraph: {
    title: 'Convicts FF League',
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: 'Convicts FF League',
    type: 'website',
    images: [{ url: `${SITE_URL}/og-card.png`, width: 1200, height: 630, alt: 'Convicts FF League' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Convicts FF League',
    description: DESCRIPTION,
    images: [`${SITE_URL}/og-card.png`],
  },
}

export const viewport: Viewport = {
  themeColor: '#080c14',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-[#0B0E11] text-s-text min-h-screen font-sans antialiased">
        <LeagueProvider>
          <Navbar />
          <main className="max-w-[1200px] mx-auto px-4 pb-16 pt-6">
            {children}
          </main>
        </LeagueProvider>
      </body>
    </html>
  )
}
