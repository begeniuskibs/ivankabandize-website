/**
 * Helper to validate deletion confirmation based on post publish status.
 * Drafts can be deleted immediately.
 * Published and scheduled posts require matching the exact slug.
 */
export function isDeleteConfirmationValid(
  publishStatus: 'draft' | 'scheduled' | 'published',
  expectedSlug: string,
  typedSlug: string
): boolean {
  if (publishStatus === 'draft') {
    return true
  }
  const cleanExpected = (expectedSlug || '').trim()
  const cleanTyped = (typedSlug || '').trim()
  if (!cleanExpected) return false
  return cleanTyped === cleanExpected
}
