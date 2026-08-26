export function markdownToNoteDoc(markdown) {
  const content = parseBlocks(String(markdown || '').replace(/\r\n/g, '\n'))
  return {
    type: 'doc',
    attrs: { stickies: [] },
    content: content.length ? content : [{ type: 'paragraph' }],
  }
}

function parseBlocks(source) {
  const lines = source.split('\n')
  const blocks = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) {
      i += 1
      continue
    }

    if (line.trim().startsWith('```')) {
      const lang = line.trim().slice(3).trim()
      const body = []
      i += 1
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        body.push(lines[i])
        i += 1
      }
      if (i < lines.length) i += 1
      blocks.push({
        type: 'codeBlock',
        attrs: { language: lang || 'text' },
        content: body.length ? [{ type: 'text', text: body.join('\n') }] : [],
      })
      continue
    }

    if (/^\s*\|.+\|\s*$/.test(line) && i + 1 < lines.length && /^\s*\|?\s*:?-{3,}/.test(lines[i + 1])) {
      const rows = []
      while (i < lines.length && /^\s*\|/.test(lines[i])) {
        const cells = splitTableRow(lines[i])
        if (!cells.every((cell) => /^:?-{3,}:?$/.test(cell))) {
          const header = rows.length === 0
          rows.push({
            type: 'tableRow',
            content: cells.map((cell) => ({
              type: header ? 'tableHeader' : 'tableCell',
              content: [{ type: 'paragraph', content: parseInline(cell) }],
            })),
          })
        }
        i += 1
      }
      if (rows.length) blocks.push({ type: 'table', content: rows })
      continue
    }

    if (/^\s*-{3,}\s*$/.test(line) || /^\s*\*{3,}\s*$/.test(line)) {
      blocks.push({ type: 'horizontalRule' })
      i += 1
      continue
    }

    const heading = /^(#{1,3})\s+(.*)$/.exec(line)
    if (heading) {
      blocks.push({
        type: 'heading',
        attrs: { level: heading[1].length },
        content: parseInline(heading[2]),
      })
      i += 1
      continue
    }

    if (/^\s*>\s?/.test(line)) {
      const quoted = []
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        quoted.push(lines[i].replace(/^\s*>\s?/, ''))
        i += 1
      }
      const inner = parseBlocks(quoted.join('\n'))
      blocks.push({
        type: 'blockquote',
        content: inner.length ? inner : [{ type: 'paragraph' }],
      })
      continue
    }

    if (/^\s*[-*]\s+\[[ xX]\]\s+/.test(line)) {
      const items = []
      while (i < lines.length && /^\s*[-*]\s+\[[ xX]\]\s+/.test(lines[i])) {
        const match = /^\s*[-*]\s+\[([ xX])\]\s+(.*)$/.exec(lines[i])
        items.push({
          type: 'taskItem',
          attrs: { checked: match[1].toLowerCase() === 'x' },
          content: [{ type: 'paragraph', content: parseInline(match[2]) }],
        })
        i += 1
      }
      blocks.push({ type: 'taskList', content: items })
      continue
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const items = []
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i]) && !/^\s*[-*]\s+\[[ xX]\]\s+/.test(lines[i])) {
        items.push({
          type: 'listItem',
          content: [{ type: 'paragraph', content: parseInline(lines[i].replace(/^\s*[-*]\s+/, '')) }],
        })
        i += 1
      }
      blocks.push({ type: 'bulletList', content: items })
      continue
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items = []
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push({
          type: 'listItem',
          content: [{ type: 'paragraph', content: parseInline(lines[i].replace(/^\s*\d+\.\s+/, '')) }],
        })
        i += 1
      }
      blocks.push({ type: 'orderedList', content: items })
      continue
    }

    const para = [line]
    i += 1
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith('```') &&
      !/^(#{1,3})\s+/.test(lines[i]) &&
      !/^\s*>\s?/.test(lines[i]) &&
      !/^\s*[-*]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !/^\s*-{3,}\s*$/.test(lines[i])
    ) {
      para.push(lines[i])
      i += 1
    }
    blocks.push({ type: 'paragraph', content: parseInline(para.join(' ')) })
  }

  return blocks
}

function splitTableRow(line) {
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '')
  return trimmed.split('|').map((cell) => cell.trim().replace(/\\\|/g, '|'))
}

function parseInline(text) {
  const source = String(text || '')
  const nodes = []
  const token =
    /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(~~[^~]+~~)|(==[^=]+==)|(\[[^\]]+\]\([^)]+\))/g
  let last = 0
  let match
  while ((match = token.exec(source))) {
    if (match.index > last) {
      nodes.push({ type: 'text', text: source.slice(last, match.index) })
    }
    const raw = match[0]
    if (raw.startsWith('`')) {
      nodes.push({ type: 'text', text: raw.slice(1, -1), marks: [{ type: 'code' }] })
    } else if (raw.startsWith('**')) {
      nodes.push({ type: 'text', text: raw.slice(2, -2), marks: [{ type: 'bold' }] })
    } else if (raw.startsWith('~~')) {
      nodes.push({ type: 'text', text: raw.slice(2, -2), marks: [{ type: 'strike' }] })
    } else if (raw.startsWith('==')) {
      nodes.push({ type: 'text', text: raw.slice(2, -2), marks: [{ type: 'highlight', attrs: { color: '#fef401' } }] })
    } else if (raw.startsWith('[')) {
      const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(raw)
      nodes.push({
        type: 'text',
        text: link[1],
        marks: [{ type: 'link', attrs: { href: link[2] } }],
      })
    } else if (raw.startsWith('*')) {
      nodes.push({ type: 'text', text: raw.slice(1, -1), marks: [{ type: 'italic' }] })
    }
    last = match.index + raw.length
  }
  if (last < source.length) {
    nodes.push({ type: 'text', text: source.slice(last) })
  }
  return nodes
}
