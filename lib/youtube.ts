export function validateYouTubeUrl(input: string): { valid: boolean; embedUrl?: string; error?: string } {
  const trimmed = (input || '').trim()
  if (!trimmed) {
    return { valid: false, error: 'YouTube URL cannot be empty.' }
  }

  try {
    const parsed = new URL(trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { valid: false, error: 'Only HTTP and HTTPS URLs are allowed.' }
    }

    const host = parsed.hostname.toLowerCase().replace(/^www\./, '').replace(/^m\./, '')

    if (host !== 'youtube.com' && host !== 'youtu.be' && host !== 'youtube-nocookie.com') {
      return { valid: false, error: 'Only youtube.com, youtu.be, and youtube-nocookie.com addresses are allowed.' }
    }

    let videoId: string | null = null

    if (host === 'youtu.be') {
      videoId = parsed.pathname.slice(1).split('/')[0] || null
    } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      if (parsed.pathname === '/watch') {
        videoId = parsed.searchParams.get('v')
      } else if (parsed.pathname.startsWith('/embed/')) {
        videoId = parsed.pathname.replace('/embed/', '').split('/')[0] || null
      } else if (parsed.pathname.startsWith('/shorts/')) {
        videoId = parsed.pathname.replace('/shorts/', '').split('/')[0] || null
      }
    }

    if (!videoId) {
      return { valid: false, error: 'Could not extract YouTube video ID from the provided URL.' }
    }

    const cleanId = videoId.replace(/[^a-zA-Z0-9_-]/g, '')
    if (!cleanId) {
      return { valid: false, error: 'Invalid YouTube video ID format.' }
    }

    return {
      valid: true,
      embedUrl: `https://www.youtube-nocookie.com/embed/${cleanId}`,
    }
  } catch {
    return { valid: false, error: 'Invalid URL format.' }
  }
}

export function getYouTubeEmbedUrl(input: string): string | null {
  const res = validateYouTubeUrl(input)
  return res.valid && res.embedUrl ? res.embedUrl : null
}
