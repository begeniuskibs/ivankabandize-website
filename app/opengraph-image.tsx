import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'

export const alt = 'Ivan Kabandize'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function OpenGraphImage() {
  const [mtnExtraBold, mtnRegular] = await Promise.all([
    readFile(join(process.cwd(), 'public', 'fonts', 'MTNBrighterSans-ExtraBold.woff')),
    readFile(join(process.cwd(), 'public', 'fonts', 'MTNBrighterSans-Regular.woff')),
  ])

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FDF8F1',
        }}
      >
        <div
          style={{
            width: 540,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 128 128"
            width="200"
            height="200"
            style={{
              marginBottom: 32,
            }}
          >
            <rect width="128" height="128" rx="10" fill="#232536" />
            <path
              d="M1.20 0.00 L14.87 0.00 A1.20 1.20 0 0 1 16.07 1.20 L16.07 20.20 A1.20 1.20 0 0 0 18.12 21.05 L38.82 0.35 A1.20 1.20 0 0 1 39.67 0.00 L59.00 0.00 A1.20 1.20 0 0 1 59.85 2.05 L16.42 45.47 A1.20 1.20 0 0 0 16.07 46.32 L16.07 67.80 A1.20 1.20 0 0 1 14.87 69.00 L1.20 69.00 A1.20 1.20 0 0 1 0.00 67.80 L0.00 1.20 A1.20 1.20 0 0 1 1.20 0.00 Z"
              fill="#FDF8F1"
              transform="translate(29.336 25.36) scale(1.12)"
            />
            <circle cx="87.69" cy="91.66" r="10.98" fill="#EF5B45" />
          </svg>

          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'center',
              fontFamily: '"MTN Brighter Sans"',
              fontSize: 70,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              color: '#232536',
              whiteSpace: 'nowrap',
              marginBottom: 16,
            }}
          >
            <span>Ivan Kabandize</span>
            <span style={{ color: '#EF5B45' }}>.</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: '"MTN Brighter Sans"',
              fontSize: 26,
              fontWeight: 400,
              lineHeight: 1.3,
              color: '#5A5D70',
              whiteSpace: 'nowrap',
            }}
          >
            Leadership, systems and technology
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: 'MTN Brighter Sans',
          data: mtnExtraBold,
          weight: 800,
          style: 'normal',
        },
        {
          name: 'MTN Brighter Sans',
          data: mtnRegular,
          weight: 400,
          style: 'normal',
        },
      ],
    }
  )
}
