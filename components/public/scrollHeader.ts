// components/public/scrollHeader.ts
// Pure helper for mobile sticky hide-on-scroll header behavior.

export interface ScrollHeaderInput {
  currentScrollY: number
  lastScrollY: number
  isMenuOpen?: boolean
  deltaThreshold?: number
  slimThreshold?: number
  previousIsHidden?: boolean
}

export interface ScrollHeaderState {
  isSlim: boolean
  isHidden: boolean
}

/**
 * Computes the slim and hidden state of the mobile header.
 *
 * Rules:
 * 1. If menu is open: always visible (never hidden).
 * 2. At top of page (currentScrollY <= slimThreshold, 64px):
 *    - Always visible (isHidden = false)
 *    - Not slim (isSlim = false)
 * 3. Scrolled past slimThreshold (currentScrollY > 64px):
 *    - Slim (isSlim = true)
 *    - Scrolling DOWN (delta > deltaThreshold, 8px) -> hides (isHidden = true)
 *    - Scrolling UP (delta < -deltaThreshold, -8px) -> shows (isHidden = false)
 *    - Small scroll delta (abs(delta) <= deltaThreshold) -> preserves previous isHidden state
 */
export function computeScrollHeaderState({
  currentScrollY,
  lastScrollY,
  isMenuOpen = false,
  deltaThreshold = 8,
  slimThreshold = 64,
  previousIsHidden = false,
}: ScrollHeaderInput): ScrollHeaderState {
  if (isMenuOpen) {
    return {
      isSlim: currentScrollY > slimThreshold,
      isHidden: false,
    }
  }

  // Always visible within the first 64px of the page
  if (currentScrollY <= slimThreshold) {
    return {
      isSlim: false,
      isHidden: false,
    }
  }

  const isSlim = true
  const delta = currentScrollY - lastScrollY

  if (delta > deltaThreshold) {
    // Scrolling DOWN
    return {
      isSlim,
      isHidden: true,
    }
  }

  if (delta < -deltaThreshold) {
    // Scrolling UP
    return {
      isSlim,
      isHidden: false,
    }
  }

  // Delta within threshold: preserve previous visibility to prevent flickering
  return {
    isSlim,
    isHidden: previousIsHidden,
  }
}
