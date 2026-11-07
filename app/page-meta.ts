import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/league'

/** A page's title and description, for the browser tab and its group-chat preview card. */
export function pageMeta(title: string, description: string, path: string): Metadata {
  const full = `${title} · Convicts FF`
  const images = [{ url: `${SITE_URL}/og-card.png`, width: 1200, height: 630, alt: 'Convicts FF League' }]
  return {
    title: full,
    description,
    openGraph: { title: full, description, url: `${SITE_URL}${path}`, siteName: 'Convicts FF League', type: 'website', images },
    twitter: { card: 'summary_large_image', title: full, description, images: [images[0].url] },
  }
}
