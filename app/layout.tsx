import type { Metadata, Viewport } from 'next'
import { Archivo, Barlow_Condensed } from 'next/font/google'
import './globals.css'
import { LeagueProvider } from '@/context/LeagueContext'
import Navbar from '@/components/layout/Navbar'
import BottomBar from '@/components/layout/BottomBar'
import Footer from '@/components/layout/Footer'
import PressKeys from '@/components/layout/PressKeys'
import { SITE_URL } from '@/lib/league'
import snapshot from '@/public/data/manifest.json'

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

const DESCRIPTION =
  `The Convicts League — ${snapshot.years.length} seasons of fantasy football history, records, earnings, matchup previews & trash talk. Live from the Sleeper API.`

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
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${barlow.variable}`} suppressHydrationWarning>
      <body className="bg-s-bg text-s-text min-h-screen font-sans antialiased pb-[calc(53px+env(safe-area-inset-bottom))] lg:pb-0">
        {/* Baked markup is the default tab's; a link to another tab hides it (globals.css) */}
        <script dangerouslySetInnerHTML={{ __html: "if(/[?&]tab=/.test(location.search))document.documentElement.setAttribute('data-deeplink','')" }} />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[200] focus:rounded-[2px] focus:border focus:border-gold focus:bg-s-bg2 focus:px-4 focus:py-2.5 focus:text-[11px] focus:font-bold focus:uppercase focus:tracking-[2px] focus:text-gold-soft"
        >
          Skip to content
        </a>
        <PressKeys />
        <LeagueProvider>
          <Navbar />
          <main id="main" tabIndex={-1} className="max-w-[1200px] mx-auto min-h-[100svh] px-4 pb-16 pt-6 outline-none">
            {children}
          </main>
          <Footer />
          <BottomBar />
        </LeagueProvider>
      </body>
    </html>
  )
}
