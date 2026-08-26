export function noteDocToMarkdown(doc) {
  return (doc?.content || []).map((node) => blockToMarkdown(node)).filter(Boolean).join('\n\n') + '\n'
}

export function sliceToMarkdown(editor) {
  if (!editor || editor.state.selection.empty) return ''
  const { from, to } = editor.state.selection
  const json = editor.state.doc.slice(from, to).content.toJSON()
  const content = Array.isArray(json) ? json : json ? [json] : []
  return noteDocToMarkdown({ type: 'doc', content })
}

function blockToMarkdown(node) {
  if (!node) return ''
  switch (node.type) {
    case 'heading': {
      const marks = '#'.repeat(Math.min(3, node.attrs?.level || 2))
      return `${marks} ${inlineToMarkdown(node)}`
    }
    case 'paragraph':
      return inlineToMarkdown(node)
    case 'codeBlock': {
      const lang = node.attrs?.language || ''
      return `\`\`\`${lang}\n${textOf(node)}\n\`\`\``
    }
    case 'blockquote':
      return (node.content || []).map((child) => `> ${blockToMarkdown(child)}`).join('\n')
    case 'horizontalRule':
      return '---'
    case 'bulletList':
      return (node.content || []).map((item) => `- ${inlineToMarkdown(item)}`).join('\n')
    case 'orderedList':
      return (node.content || [])
        .map((item, index) => `${index + 1}. ${inlineToMarkdown(item)}`)
        .join('\n')
    case 'taskList':
      return (node.content || [])
        .map((item) => `- [${item.attrs?.checked ? 'x' : ' '}] ${inlineToMarkdown(item)}`)
        .join('\n')
    case 'callout':
      return `> ${inlineToMarkdown(node)}`
    case 'collapsibleSection': {
      const title = node.attrs?.title || 'Seção'
      const body = (node.content || []).map((child) => blockToMarkdown(child)).join('\n\n')
      return `## ${title}\n\n${body}`
    }
    case 'table':
      return tableToMarkdown(node)
    default:
      return (node.content || []).map((child) => blockToMarkdown(child)).filter(Boolean).join('\n')
  }
}

function tableToMarkdown(node) {
  const rows = node.content || []
  return rows
    .map((row, index) => {
      const cells = (row.content || []).map((cell) => inlineToMarkdown(cell).replace(/\|/g, '\\|'))
      const line = `| ${cells.join(' | ')} |`
      if (index === 0) return `${line}\n| ${cells.map(() => '---').join(' | ')} |`
      return line
    })
    .join('\n')
}

function inlineToMarkdown(node) {
  if (!node) return ''
  if (node.type === 'text') return applyMarks(node.text || '', node.marks)
  if (node.type === 'hardBreak') return '\n'
  return (node.content || []).map((child) => inlineToMarkdown(child)).join('')
}

function applyMarks(text, marks = []) {
  let next = text
  for (const mark of marks) {
    if (mark.type === 'bold') next = `**${next}**`
    if (mark.type === 'italic') next = `*${next}*`
    if (mark.type === 'strike') next = `~~${next}~~`
    if (mark.type === 'code') next = `\`${next}\``
    if (mark.type === 'highlight') next = `==${next}==`
    if (mark.type === 'link') next = `[${next}](${mark.attrs?.href || ''})`
  }
  return next
}

function textOf(node) {
  if (!node) return ''
  if (node.type === 'text') return node.text || ''
  return (node.content || []).map((child) => textOf(child)).join('')
}
