import type { Metadata, Viewport } from 'next'
import { Archivo, Barlow_Condensed } from 'next/font/google'
import './globals.css'
import { LeagueProvider } from '@/context/LeagueContext'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

// Midnight Prime — Archivo for UI/body, Barlow Condensed for display numerals/names.
const archivo = Archivo({
  subsets: ['latin'],
  variable: '--font-archivo',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
})

const barlow = Barlow_Condensed({
  subsets: ['latin'],
  variable: '--font-barlow',
  display: 'swap',
  weight: ['700', '800'],
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
  themeColor: '#050506',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${barlow.variable}`}>
      <body className="bg-s-bg text-s-text min-h-screen font-sans antialiased">
        <LeagueProvider>
          <Navbar />
          <main className="max-w-[1200px] mx-auto px-4 pb-16 pt-6">
            {children}
          </main>
          <Footer />
        </LeagueProvider>
      </body>
    </html>
  )
}
