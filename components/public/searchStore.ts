'use client'

import { useSyncExternalStore } from 'react'

let isOpen = false
let returnTrigger: HTMLElement | null = null
const listeners = new Set<() => void>()

export function openSearch(trigger?: HTMLElement | null) {
  isOpen = true
  if (trigger) {
    returnTrigger = trigger
  }
  listeners.forEach((listener) => listener())
}

export function closeSearch() {
  isOpen = false
  listeners.forEach((listener) => listener())
  if (returnTrigger) {
    returnTrigger.focus()
    returnTrigger = null
  }
}

export function useSearchOpen(): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      listeners.add(onStoreChange)
      return () => listeners.delete(onStoreChange)
    },
    () => isOpen,
    () => false
  )
}
