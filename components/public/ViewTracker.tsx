'use client'

import { useEffect, useRef } from 'react'

interface ViewTrackerProps {
  slug: string
}

export default function ViewTracker({ slug }: ViewTrackerProps) {
  const sentRef = useRef(false)

  useEffect(() => {
    if (!slug || sentRef.current) return
    sentRef.current = true

    try {
      fetch('/api/views', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slug }),
        keepalive: true,
      }).catch(() => {
        // Errors swallowed
      })
    } catch {
      // Errors swallowed
    }
  }, [slug])

  return null
}

