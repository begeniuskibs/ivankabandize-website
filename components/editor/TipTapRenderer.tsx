import React from 'react'

interface TipTapNode {
  type: string
  attrs?: Record<string, unknown>
  content?: TipTapNode[]
  text?: string
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>
}

interface TipTapDoc {
  type?: string
  content?: TipTapNode[]
}

export default function TipTapRenderer({ content }: { content: TipTapDoc | Record<string, unknown> }) {
  if (!content || typeof content !== 'object' || !('content' in content) || !Array.isArray(content.content)) {
    return <p className="text-gray-500 italic">No content available.</p>
  }

  const renderNode = (node: TipTapNode, index: number): React.ReactNode => {
    switch (node.type) {
      case 'paragraph':
        return (
          <p key={index} className="text-gray-800 leading-relaxed mb-6 text-lg">
            {node.content?.map(renderInline) || <br />}
          </p>
        )
      case 'heading': {
        const level = (node.attrs?.level as number) || 2
        const headingText = node.content?.map(renderInline)
        if (level === 1) {
          return (
            <h1 key={index} className="text-3xl font-bold text-gray-900 mt-10 mb-4 tracking-tight">
              {headingText}
            </h1>
          )
        }
        if (level === 2) {
          return (
            <h2 key={index} className="text-2xl font-bold text-gray-900 mt-8 mb-4 tracking-tight">
              {headingText}
            </h2>
          )
        }
        return (
          <h3 key={index} className="text-xl font-semibold text-gray-900 mt-6 mb-3">
            {headingText}
          </h3>
        )
      }
      case 'bulletList':
        return (
          <ul key={index} className="list-disc list-inside space-y-2 mb-6 text-gray-800 text-lg">
            {node.content?.map((item, i) => (
              <li key={i}>{item.content?.map(renderNode)}</li>
            ))}
          </ul>
        )
      case 'orderedList':
        return (
          <ol key={index} className="list-decimal list-inside space-y-2 mb-6 text-gray-800 text-lg">
            {node.content?.map((item, i) => (
              <li key={i}>{item.content?.map(renderNode)}</li>
            ))}
          </ol>
        )
      case 'blockquote':
        return (
          <blockquote
            key={index}
            className="border-l-4 border-black pl-4 py-1 italic my-6 text-gray-700 bg-gray-50 rounded-r"
          >
            {node.content?.map(renderNode)}
          </blockquote>
        )
      case 'codeBlock':
        return (
          <pre
            key={index}
            className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm my-6 font-mono"
          >
            <code>{node.content?.map(n => n.text).join('')}</code>
          </pre>
        )
      default:
        return (
          <div key={index} className="mb-4">
            {node.content?.map(renderNode)}
          </div>
        )
    }
  }

  const renderInline = (node: TipTapNode, index: number): React.ReactNode => {
    let element: React.ReactNode = node.text || ''

    if (node.marks) {
      node.marks.forEach(mark => {
        if (mark.type === 'bold') {
          element = <strong key={`b-${index}`}>{element}</strong>
        }
        if (mark.type === 'italic') {
          element = <em key={`i-${index}`}>{element}</em>
        }
        if (mark.type === 'code') {
          element = (
            <code key={`c-${index}`} className="bg-gray-100 text-red-600 px-1 py-0.5 rounded text-sm font-mono">
              {element}
            </code>
          )
        }
        if (mark.type === 'link') {
          element = (
            <a
              key={`a-${index}`}
              href={String(mark.attrs?.href || '#')}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {element}
            </a>
          )
        }
      })
    }

    return <React.Fragment key={index}>{element}</React.Fragment>
  }

  return (
    <article className="prose prose-lg max-w-none">
      {(content as TipTapDoc).content?.map(renderNode)}
    </article>
  )
}
