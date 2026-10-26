// Calculate dynamic read time based on word count (approx 200 words per minute)
export function calculateReadTime(content: unknown, excerpt?: string | null): number {
  let text = excerpt || ''
  const extractText = (node: any) => {
    if (!node) return
    if (node.text) text += ' ' + node.text
    if (Array.isArray(node.content)) node.content.forEach(extractText)
  }
  if (content && typeof content === 'object') {
    extractText(content)
  }
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}
