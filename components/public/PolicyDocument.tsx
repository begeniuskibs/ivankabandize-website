import React from 'react'
import Link from 'next/link'

interface TableBlock {
  type: 'table'
  rows: string[][]
}

interface ListBlock {
  type: 'list'
  items: string[]
}

interface HeadingBlock {
  type: 'h2'
  text: string
}

interface ParagraphBlock {
  type: 'p'
  text: string
}

type LegalBlock = HeadingBlock | ParagraphBlock | ListBlock | TableBlock

export interface ParsedLegalDocument {
  h1: string
  version: string
  blocks: LegalBlock[]
}

export function parseLegalMarkdown(md: string): ParsedLegalDocument {
  const lines = md.split(/\r?\n/)
  let h1 = ''
  let version = ''
  const blocks: LegalBlock[] = []
  let currentBlock: LegalBlock | null = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // Top-level document title
    if (!h1 && trimmed.startsWith('# ')) {
      h1 = trimmed.slice(2).trim()
      continue
    }

    // Version and last updated line under H1
    if (h1 && !version && trimmed.startsWith('Version ')) {
      version = trimmed
      continue
    }

    // Section headings (H2)
    if (trimmed.startsWith('## ')) {
      if (currentBlock) {
        blocks.push(currentBlock)
        currentBlock = null
      }
      blocks.push({ type: 'h2', text: trimmed.slice(3).trim() })
      continue
    }

    // Pipe tables
    if (trimmed.startsWith('|')) {
      if (!currentBlock || currentBlock.type !== 'table') {
        if (currentBlock) blocks.push(currentBlock)
        currentBlock = { type: 'table', rows: [] }
      }
      const cells = line
        .split('|')
        .slice(1, -1)
        .map((c) => c.trim())
      // Skip markdown table delimiter rows (|---|---|...)
      const isDivider = cells.length > 0 && cells.every((c) => /^[-:\s]+$/.test(c))
      if (!isDivider) {
        currentBlock.rows.push(cells)
      }
      continue
    }

    // Bullet list items
    if (trimmed.startsWith('- ')) {
      if (!currentBlock || currentBlock.type !== 'list') {
        if (currentBlock) blocks.push(currentBlock)
        currentBlock = { type: 'list', items: [] }
      }
      currentBlock.items.push(trimmed.slice(2).trim())
      continue
    }

    // Blank lines delimit paragraphs / blocks
    if (trimmed === '') {
      if (currentBlock) {
        blocks.push(currentBlock)
        currentBlock = null
      }
      continue
    }

    // Regular paragraph text
    if (!currentBlock || currentBlock.type !== 'p') {
      if (currentBlock) blocks.push(currentBlock)
      currentBlock = { type: 'p', text: trimmed }
    } else {
      currentBlock.text += ' ' + trimmed
    }
  }

  if (currentBlock) {
    blocks.push(currentBlock)
  }

  return { h1, version, blocks }
}

function isInternalLink(href: string): boolean {
  if (href.startsWith('/')) return true
  try {
    const url = new URL(href)
    return (
      url.hostname === 'ivankabandize.com' ||
      url.hostname === 'www.ivankabandize.com' ||
      url.hostname === 'localhost'
    )
  } catch {
    return false
  }
}

function normalizeInternalHref(href: string): string {
  try {
    const url = new URL(href)
    if (
      url.hostname === 'ivankabandize.com' ||
      url.hostname === 'www.ivankabandize.com' ||
      url.hostname === 'localhost'
    ) {
      return url.pathname + url.search + url.hash || '/'
    }
  } catch {
    // If not a full URL string, keep as is
  }
  return href
}

export function renderInlineMarkdown(text: string): React.ReactNode {
  // Split on bold (**...**) and markdown links ([...](...))
  const tokenRegex = /(\*\*.*?\*\*|\[.*?\]\(.*?\))/g
  const parts = text.split(tokenRegex)

  return parts.map((part, index) => {
    if (!part) return null

    // Bold text
    if (part.startsWith('**') && part.endsWith('**')) {
      const inner = part.slice(2, -2)
      return (
        <strong key={index} className="font-semibold text-[#232536]">
          {renderInlineMarkdown(inner)}
        </strong>
      )
    }

    // Link
    const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/)
    if (linkMatch) {
      const [, linkText, rawHref] = linkMatch
      const href = rawHref.trim()

      if (isInternalLink(href)) {
        return (
          <Link
            key={index}
            href={normalizeInternalHref(href)}
            className="text-[#CF3F29] hover:text-[#b83420] underline underline-offset-2 transition"
          >
            {linkText}
          </Link>
        )
      }

      if (href.startsWith('mailto:')) {
        return (
          <a
            key={index}
            href={href}
            className="text-[#CF3F29] hover:text-[#b83420] underline underline-offset-2 transition"
          >
            {linkText}
          </a>
        )
      }

      // External link - opens in new tab with noopener noreferrer
      return (
        <a
          key={index}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#CF3F29] hover:text-[#b83420] underline underline-offset-2 transition"
        >
          {linkText}
        </a>
      )
    }

    return <React.Fragment key={index}>{part}</React.Fragment>
  })
}

export default function PolicyDocument({ markdown }: { markdown: string }) {
  const { h1, version, blocks } = parseLegalMarkdown(markdown)

  return (
    <article className="font-sans text-[#232536]">
      {/* Document Header */}
      <header className="mb-10 sm:mb-12 border-b border-[#F0E4D2] pb-6 sm:pb-8">
        <h1 className="font-['MTN_Brighter_Sans',_sans-serif] text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#232536] leading-[1.15] mb-3">
          {h1}
        </h1>
        {version && (
          <p className="text-sm sm:text-base text-[#5C5F73] font-medium">
            {version}
          </p>
        )}
      </header>

      {/* Document Content */}
      <div className="space-y-4">
        {blocks.map((block, idx) => {
          if (block.type === 'h2') {
            return (
              <h2
                key={idx}
                className="font-['MTN_Brighter_Sans',_sans-serif] font-bold text-2xl sm:text-3xl text-[#232536] mt-10 sm:mt-12 mb-4 tracking-tight"
              >
                {renderInlineMarkdown(block.text)}
              </h2>
            )
          }

          if (block.type === 'p') {
            return (
              <p
                key={idx}
                className="text-base sm:text-[17px] text-[#232536] leading-relaxed mb-5"
              >
                {renderInlineMarkdown(block.text)}
              </p>
            )
          }

          if (block.type === 'list') {
            return (
              <ul
                key={idx}
                className="list-disc list-outside pl-5 space-y-2 mb-6 text-base sm:text-[17px] text-[#232536] leading-relaxed"
              >
                {block.items.map((item, itemIdx) => (
                  <li key={itemIdx}>
                    {renderInlineMarkdown(item)}
                  </li>
                ))}
              </ul>
            )
          }

          if (block.type === 'table') {
            const [headerRow, ...bodyRows] = block.rows
            if (!headerRow) return null

            return (
              <div
                key={idx}
                className="max-md:overflow-x-auto max-md:block my-6 overflow-hidden rounded-xl border border-[#F0E4D2] bg-white"
              >
                <table className="w-full text-left border-collapse text-sm sm:text-base">
                  <thead>
                    <tr className="bg-[#FDF8F1] text-[#232536] border-b border-[#F0E4D2]">
                      {headerRow.map((cell, cIdx) => (
                        <th
                          key={cIdx}
                          className="p-3.5 sm:p-4 font-bold border-r last:border-r-0 border-[#F0E4D2] align-top text-[#232536]"
                        >
                          {renderInlineMarkdown(cell)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bodyRows.map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        className="border-b last:border-b-0 border-[#F0E4D2] hover:bg-[#FDF8F1]/50 transition-colors"
                      >
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className="p-3.5 sm:p-4 border-r last:border-r-0 border-[#F0E4D2] align-top text-[#232536] leading-relaxed"
                          >
                            {renderInlineMarkdown(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }

          return null
        })}
      </div>
    </article>
  )
}
