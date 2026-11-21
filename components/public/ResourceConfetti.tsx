'use client'

import { useEffect, useRef } from 'react'
import { makeConfettiPieces, shouldAnimate } from '@/lib/resourceFlow'

// Canvas-based brand confetti burst for Resources success screen
// House style: spaced hyphen " - " only

export default function ResourceConfetti() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mediaQuery.matches || !shouldAnimate(mediaQuery.matches)) {
      canvas.style.display = 'none'
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const startX = canvas.width / 2
    const startY = canvas.height * 0.28 // Center around the green success tick
    const pieces = makeConfettiPieces(36, 12345)

    const startTime = performance.now()
    const duration = 2400
    let animId: number

    function render(now: number) {
      if (!ctx || !canvas) return
      const elapsed = now - startTime
      const progress = Math.min(1, elapsed / duration)

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      if (progress >= 1) {
        canvas.style.display = 'none'
        return
      }

      pieces.forEach((p) => {
        const pieceElapsed = Math.max(0, elapsed - p.delayMs)
        const t = pieceElapsed / 1000
        if (t <= 0) return

        const currentX = startX + p.vx * t
        const currentY = startY + p.vy * t + 0.5 * 380 * t * t
        const currentRotation = (p.rotation + t * 360) * (Math.PI / 180)
        const alpha = Math.max(0, 1 - progress * 1.1)

        ctx.save()
        ctx.translate(currentX, currentY)
        ctx.rotate(currentRotation)
        ctx.globalAlpha = alpha
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size * 0.6)
        ctx.restore()
      })

      animId = requestAnimationFrame(render)
    }

    animId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animId)
      if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-50 w-full h-full"
    />
  )
}
