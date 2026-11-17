'use client'

import { useSyncExternalStore } from 'react'

const QUERY = '(max-width: 1023px)'

function subscribe(onChange: () => void) {
  const media = window.matchMedia(QUERY)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

/**
 * True where the bottom bar is the navigation (under 1024px). False on the
 * server and until the page hydrates, so anything that must not run on a
 * desktop (a sheet that locks the page, a card that polls) can wait for it.
 */
export function useBelowLg(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false)
}
