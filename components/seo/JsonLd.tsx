import React from 'react'

export interface JsonLdProps {
  data: Record<string, unknown>
}

export default function JsonLd({ data }: JsonLdProps) {
  const jsonString = JSON.stringify(data).replace(/</g, '\\u003c')
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonString }}
    />
  )
}
