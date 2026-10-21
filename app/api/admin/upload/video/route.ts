import { getAuthenticatedOwner } from '@/utils/supabase/auth'
import { NextResponse, type NextRequest } from 'next/server'
import {
  ALLOWED_VIDEO_EXTENSIONS,
  MAX_VIDEO_SIZE_BYTES,
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

    const rawExt = file.name.includes('.') ? file.name.split('.').pop() || '' : ''
    const ext = (rawExt || 'mp4').toLowerCase()

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

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const cleanFileName = file.name
      .replace(/\.[^/.]+$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    const path = `${Date.now()}-${cleanFileName || 'upload'}.${ext}`

    const { data, error: uploadError } = await supabase.storage
      .from('post-videos')
      .upload(path, buffer, {
        contentType: file.type || 'video/mp4',
        upsert: true,
      })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('post-videos').getPublicUrl(data.path)

    return NextResponse.json({ url: publicUrl, path: data.path, bucket: 'post-videos' }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
