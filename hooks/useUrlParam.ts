'use client'

import { useCallback, useSyncExternalStore } from 'react'
import { withSearchParams } from '@/lib/utils'

// Tabs, weeks, years and open matchups live in the URL, so a group-chat link
// opens exactly what was shared and a refresh keeps your place. The store is
// the address bar itself; the server render sees no params, so a deep link
// hydrates on the default and moves right after.

const CHANGE = 'convicts:url-param'

function subscribe(onChange: () => void) {
  window.addEventListener('popstate', onChange)
  window.addEventListener(CHANGE, onChange)
  return () => {
    window.removeEventListener('popstate', onChange)
    window.removeEventListener(CHANGE, onChange)
  }
}

/** Writes params to the URL; null removes one. `push` adds a Back-button stop, for popups. */
function setUrlParams(updates: Record<string, string | null>, push?: { marker: string }) {
  const search = withSearchParams(window.location.search, updates)
  const url = `${window.location.pathname}${search}${window.location.hash}`
  if (push) window.history.pushState({ urlModal: push.marker }, '', url)
  else window.history.replaceState(null, '', url)
  window.dispatchEvent(new Event(CHANGE))
}

function useRawParam(key: string): string | null {
  return useSyncExternalStore(subscribe, () => new URLSearchParams(window.location.search).get(key), () => null)
}

/** A value kept in the URL. Anything not in `allowed` reads as the fallback; the fallback itself leaves the URL clean. */
export function useUrlParam(key: string, fallback: string): [string, (value: string) => void]
export function useUrlParam<T extends string>(key: string, fallback: T, allowed: readonly T[]): [T, (value: T) => void]
export function useUrlParam<T extends string>(key: string, fallback: T, allowed?: readonly T[]): [T, (value: T) => void] {
  const raw = useRawParam(key)
  const value = raw != null && (!allowed || allowed.includes(raw as T)) ? (raw as T) : fallback
  const set = useCallback((next: T) => setUrlParams({ [key]: next === fallback ? null : next }), [key, fallback])
  return [value, set]
}

/**
 * A popup whose target is in the URL, so it can be shared. Opening adds a
 * Back-button stop, and Back closes it. Arriving from a link there's no stop
 * of ours to go back to, so closing just clears the param.
 */
export function useUrlModal(key: string): [string | null, (value: string, also?: Record<string, string | null>) => void, () => void] {
  const value = useRawParam(key)
  const open = useCallback((next: string, also?: Record<string, string | null>) => {
    setUrlParams({ ...also, [key]: next }, { marker: key })
  }, [key])
  const close = useCallback(() => {
    if ((window.history.state as { urlModal?: string } | null)?.urlModal === key) window.history.back()
    else setUrlParams({ [key]: null })
  }, [key])
  return [value, open, close]
}
