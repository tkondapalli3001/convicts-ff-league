'use client'

import { useCallback, useSyncExternalStore } from 'react'

// "Pick who you are": no login, remembered on this device. Anyone can pick
// anyone, and that's fine. Storage can be blocked (private mode), so every
// read and write tolerates failure; the site then just doesn't remember.

const KEY = 'convicts:me'
const CHANGE = 'convicts:me-change'

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE, onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(CHANGE, onChange)
    window.removeEventListener('storage', onChange)
  }
}

function read(): string | null {
  try { return window.localStorage.getItem(KEY) } catch { return null }
}

export interface Me {
  /** The owner's name; '' if they said not now; null if never asked; undefined before the page hydrates. */
  me: string | null | undefined
  setMe: (owner: string) => void
}

export function useMe(): Me {
  const me = useSyncExternalStore<string | null | undefined>(subscribe, read, () => undefined)
  const setMe = useCallback((owner: string) => {
    try { window.localStorage.setItem(KEY, owner) } catch { /* private mode: not remembered */ }
    window.dispatchEvent(new Event(CHANGE))
  }, [])
  return { me, setMe }
}
