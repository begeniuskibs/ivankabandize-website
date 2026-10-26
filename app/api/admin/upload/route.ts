import { getAuthenticatedOwner } from '@/utils/supabase/auth'
import { NextResponse, type NextRequest } from 'next/server'
import {
  ALLOWED_IMAGE_EXTENSIONS,
  ALLOWED_VIDEO_EXTENSIONS,
  MAX_IMAGE_SIZE_BYTES,
  MAX_VIDEO_SIZE_BYTES,
  isAllowedImageExtension,
  isAllowedVideoExtension,
} from '@/lib/uploadRules'

export async function POST(request: NextRequest) {
  const { supabase, error: authError, status: authStatus } = await getAuthenticatedOwner()

  if (authError) {
    return NextResponse.json({ error: authError }, { status: authStatus })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const requestedBucket = formData.get('bucket') as string | null
    if (requestedBucket && requestedBucket !== 'post-images' && requestedBucket !== 'post-videos') {
      return NextResponse.json(
        { error: 'Invalid bucket. Allowed buckets: post-images, post-videos' },
        { status: 400 }
      )
    }

    const rawExt = file.name.includes('.') ? file.name.split('.').pop() || '' : ''
    const isVideo =
      file.type.startsWith('video/') ||
      requestedBucket === 'post-videos' ||
      isAllowedVideoExtension(rawExt)
    const bucket = requestedBucket || (isVideo ? 'post-videos' : 'post-images')

    const ext = (rawExt || (isVideo ? 'mp4' : 'jpg')).toLowerCase()

    if (bucket === 'post-images') {
      if (!isAllowedImageExtension(ext)) {
        return NextResponse.json(
          {
            error: `File extension .${ext} is not allowed for post-images. Allowed extensions: ${ALLOWED_IMAGE_EXTENSIONS.join(
              ', '
            )}`,
          },
          { status: 400 }
        )
      }
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        return NextResponse.json(
          { error: 'File size exceeds 10 MB limit for images' },
          { status: 413 }
        )
      }
    } else if (bucket === 'post-videos') {
      if (!isAllowedVideoExtension(ext)) {
        return NextResponse.json(
          {
            error: `File extension .${ext} is not allowed for post-videos. Allowed extensions: ${ALLOWED_VIDEO_EXTENSIONS.join(
              ', '
            )}`,
          },
          { status: 400 }
        )
      }
      if (file.size > MAX_VIDEO_SIZE_BYTES) {
        return NextResponse.json(
          { error: 'File size exceeds 100 MB limit for videos' },
          { status: 413 }
        )
      }
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const cleanFileName = file.name
      .replace(/\.[^/.]+$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    const path = `${Date.now()}-${cleanFileName || 'upload'}.${ext}`

    const { data, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, buffer, {
        contentType: file.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
        upsert: true,
      })

    if (uploadError) {
      console.error('[api/admin/upload POST]', uploadError.message)
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(data.path)

    return NextResponse.json({ url: publicUrl, path: data.path, bucket }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed'
    console.error('[api/admin/upload POST]', message)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
