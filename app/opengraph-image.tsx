import { ImageResponse } from 'next/og'

export const alt = 'Ivan Kabandize'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          backgroundColor: '#FDF8F1',
          padding: '80px 100px',
        }}
      >
        <div
          style={{
            fontSize: 76,
            fontWeight: 800,
            color: '#232536',
            letterSpacing: '-0.02em',
            marginBottom: 24,
            display: 'flex',
          }}
        >
          Ivan Kabandize
        </div>
        <div
          style={{
            width: 140,
            height: 6,
            backgroundColor: '#EF5B45',
            marginBottom: 32,
            borderRadius: 3,
            display: 'flex',
          }}
        />
        <div
          style={{
            fontSize: 32,
            color: '#232536',
            opacity: 0.85,
            fontWeight: 500,
            display: 'flex',
          }}
        >
          Leadership, systems, technology and faith
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
