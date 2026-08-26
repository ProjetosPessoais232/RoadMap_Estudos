export const EMPTY_NOTE_BODY = `Escreva o que você entendeu desta parte do curso.

\`\`\`python
print("Olá, mundo")
\`\`\`

Esse comando representa a saída de dados no seu terminal.
`

export function parseNoteBlocks(body) {
  const text = body || ''
  const blocks = []
  const fence = /```([a-zA-Z0-9_+-]*)[ \t]*\r?\n([\s\S]*?)```/g
  let last = 0
  let match
  while ((match = fence.exec(text))) {
    const before = text.slice(last, match.index).replace(/\n$/, '')
    if (before.length) blocks.push({ type: 'text', content: before })
    blocks.push({ type: 'code', language: match[1] || 'text', content: match[2].replace(/\n$/, '') })
    last = match.index + match[0].length
  }
  const after = text.slice(last).replace(/^\n/, '')
  if (after.length) blocks.push({ type: 'text', content: after })
  return blocks
}

export function splitNotebookLines(content) {
  return String(content ?? '').split('\n')
}
