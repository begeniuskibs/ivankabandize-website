import { getAuthenticatedOwner } from '@/utils/supabase/auth'
import { NextResponse, type NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const { supabase, error: authError, status: authStatus } = await getAuthenticatedOwner()

  if (authError) {
    return NextResponse.json({ error: authError }, { status: authStatus })
  }

  try {
    const body = await request.json()
    const { filename, contentType, bucket } = body

    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 })
    }

    const isVideo =
      (contentType && typeof contentType === 'string' && contentType.startsWith('video/')) ||
      bucket === 'post-videos'

    const targetBucket = bucket === 'post-videos' || isVideo ? 'post-videos' : 'post-images'
    const defaultExt = targetBucket === 'post-videos' ? 'mp4' : 'jpg'
    const ext = filename.split('.').pop() || defaultExt

    const cleanFileName = filename
      .replace(/\.[^/.]+$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    const path = `${Date.now()}-${cleanFileName || 'upload'}.${ext}`

    // Create a signed upload URL valid for 2 hours
    const { data, error: signError } = await supabase.storage
      .from(targetBucket)
      .createSignedUploadUrl(path)

    if (signError || !data) {
      return NextResponse.json(
        { error: signError?.message || 'Failed to create signed upload URL' },
        { status: 500 }
      )
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(targetBucket).getPublicUrl(path)

    return NextResponse.json({
      signedUrl: data.signedUrl,
      path,
      publicUrl,
      bucket: targetBucket,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error creating signed upload URL'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
