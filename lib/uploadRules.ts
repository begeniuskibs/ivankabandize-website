/**
 * Shared upload validation rules for admin media uploads.
 */

export const ALLOWED_BUCKETS = ['post-images', 'post-videos'] as const
export type AllowedBucket = (typeof ALLOWED_BUCKETS)[number]

export const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'] as const
export const ALLOWED_VIDEO_EXTENSIONS = ['mp4', 'webm', 'mov', 'm4v'] as const

export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB
export const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024 // 100 MB

export function isAllowedImageExtension(ext: string): boolean {
  return (ALLOWED_IMAGE_EXTENSIONS as readonly string[]).includes(ext.toLowerCase())
}

export function isAllowedVideoExtension(ext: string): boolean {
  return (ALLOWED_VIDEO_EXTENSIONS as readonly string[]).includes(ext.toLowerCase())
}
