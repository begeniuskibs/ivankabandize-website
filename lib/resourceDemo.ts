// Pure helper functions for interactive resource demo tabs and swipe navigation
// House style: spaced hyphen " - " only

export const SWIPE_THRESHOLD_PX = 40

export function getNextTabIndex(current: number, total: number): number {
  if (total <= 0) return 0
  return (current + 1) % total
}

export function getPrevTabIndex(current: number, total: number): number {
  if (total <= 0) return 0
  return (current - 1 + total) % total
}

export function getFirstTabIndex(): number {
  return 0
}

export function getLastTabIndex(total: number): number {
  if (total <= 0) return 0
  return total - 1
}

export type SwipeDirection = 'left' | 'right' | 'none'

export function getSwipeDirection(
  startX: number,
  endX: number,
  threshold = SWIPE_THRESHOLD_PX
): SwipeDirection {
  const deltaX = endX - startX
  if (deltaX <= -threshold) return 'left'
  if (deltaX >= threshold) return 'right'
  return 'none'
}

export function getSwipedTabIndex(
  current: number,
  total: number,
  startX: number,
  endX: number,
  threshold = SWIPE_THRESHOLD_PX
): number {
  if (total <= 0) return 0
  const dir = getSwipeDirection(startX, endX, threshold)
  if (dir === 'left') {
    // Swipe left moves to next tab, no wrap
    return Math.min(total - 1, current + 1)
  }
  if (dir === 'right') {
    // Swipe right moves to previous tab, no wrap
    return Math.max(0, current - 1)
  }
  return current
}
