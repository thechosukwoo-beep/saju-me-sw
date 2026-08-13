const PREVIEW_MAX_CHARS = 380

export function splitResultSummary(markdown) {
  const text = String(markdown || '').trim()
  if (!text) return { summary: '', body: '' }

  const headingIndex = text.search(/^#{1,3}\s+/m)
  const lead = headingIndex === -1 ? text : text.slice(0, headingIndex).trim()
  const rest = headingIndex === -1 ? '' : text.slice(headingIndex).trim()

  if (!lead || /^#{1,3}\s+/.test(lead)) {
    return { summary: '', body: text }
  }

  const [firstBlock, ...leadRest] = lead.split(/\n\s*\n/)
  const summary = (firstBlock || '').trim()
  const body = [...leadRest, rest].filter(Boolean).join('\n\n').trim()

  return { summary, body }
}

export function getResultPreview(markdown, maxChars = PREVIEW_MAX_CHARS) {
  const text = String(markdown || '').trim()
  if (!text) return ''

  const headingMatches = [...text.matchAll(/^##\s+/gm)]
  if (headingMatches.length >= 2) {
    return text.slice(0, headingMatches[1].index).trim()
  }

  if (text.length <= maxChars) return text

  const slice = text.slice(0, maxChars)
  const breakAt = Math.max(slice.lastIndexOf('\n\n'), slice.lastIndexOf('\n'))
  return (breakAt > 80 ? slice.slice(0, breakAt) : slice).trim()
}
