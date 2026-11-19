// Pure HMAC-SHA256 request fingerprint calculation for Resources downloads
// House style: spaced hyphen " - " only

import { createHmac } from 'node:crypto'

const MIN_SECRET_LENGTH = 32

/**
 * Computes an HMAC-SHA256 request fingerprint keyed by the server secret over the client IP.
 * Fails closed if the secret is missing or shorter than 32 characters.
 */
export function computeRequestFingerprint(ip: string, secret: string): string {
  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    throw new Error('RESOURCE_FINGERPRINT_SECRET must be at least 32 characters')
  }
  return createHmac('sha256', secret).update(ip).digest('hex')
}
