import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { LeagueProvider } from '@/context/LeagueContext'
import Navbar from '@/components/layout/Navbar'
import MobileNav from '@/components/layout/MobileNav'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800', '900'],
})

export const metadata: Metadata = {
  title: 'MC Fantasy Football League',
  description: 'MC FF League — 7 seasons of history, records, earnings & trash talk',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-[#020617] text-s-text min-h-screen font-sans antialiased">
        <LeagueProvider>
          <Navbar />
          <main className="max-w-[1200px] mx-auto px-4 pb-24 pt-6">
            {children}
          </main>
          <MobileNav />
        </LeagueProvider>
      </body>
    </html>
  )
}
