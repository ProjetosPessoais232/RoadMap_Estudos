import { listHeadingAnchors } from './marks/headingId.js'

export function slashItems({ onSticky } = {}) {
  return [
    {
      key: 'h1',
      label: 'Título H1',
      hint: 'H1',
      run: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      key: 'h2',
      label: 'Subtítulo H2',
      hint: 'H2',
      run: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      key: 'paragraph',
      label: 'Texto',
      hint: 'Parágrafo',
      run: (editor) => editor.chain().focus().setParagraph().run(),
    },
    {
      key: 'bullet',
      label: 'Lista',
      hint: 'Marcadores',
      run: (editor) => editor.chain().focus().toggleBulletList().run(),
    },
    {
      key: 'task',
      label: 'To-do',
      hint: 'Checklist',
      run: (editor) => editor.chain().focus().toggleTaskList().run(),
    },
    {
      key: 'code',
      label: 'Código',
      hint: 'Java',
      run: (editor) => editor.chain().focus().setCodeBlock({ language: 'java' }).run(),
    },
    {
      key: 'callout',
      label: 'Callout',
      hint: 'Destaque',
      run: (editor) => editor.chain().focus().insertCallout('important').run(),
    },
    {
      key: 'hr',
      label: 'Divisor',
      hint: 'Linha',
      run: (editor) => editor.chain().focus().setHorizontalRule().run(),
    },
    {
      key: 'sticky',
      label: 'Sticky',
      hint: 'Margem',
      hidden: true,
      run: () => onSticky?.(),
    },
  ]
}

export function insertHeadingAnchor(editor) {
  if (!editor) return
  if (editor.isActive('heading')) {
    const id = editor.getAttributes('heading').id
    if (id) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: `#${id}` }).run()
      window.navigator.clipboard?.writeText(`#${id}`).catch(() => {})
      return
    }
  }
  const headings = listHeadingAnchors(editor)
  if (headings[0]) {
    editor.chain().focus().setLink({ href: `#${headings[0].id}` }).run()
    return
  }
  editor.chain().focus().toggleHeading({ level: 2 }).run()
}

export function readingLabel(words) {
  const count = Number(words) || 0
  if (count < 50) return 'menos de 1 min'
  const minutes = Math.max(1, Math.round(count / 200))
  return `${minutes} min de leitura`
}

export function findMatches(editor, query) {
  if (!editor || !query) return []
  const needle = query.toLowerCase()
  const matches = []
  editor.state.doc.descendants((node, pos) => {
    if (!node.isText) return
    const hay = node.text.toLowerCase()
    let from = 0
    while (from < hay.length) {
      const index = hay.indexOf(needle, from)
      if (index === -1) break
      matches.push({ from: pos + index, to: pos + index + query.length })
      from = index + Math.max(query.length, 1)
    }
  })
  return matches
}

export function selectMatch(editor, match) {
  if (!editor || !match) return
  editor.chain().focus().setTextSelection({ from: match.from, to: match.to }).scrollIntoView().run()
}

export function replaceMatch(editor, match, text) {
  if (!editor || !match) return
  editor.chain().focus().insertContentAt({ from: match.from, to: match.to }, text || '').run()
}

export function replaceAllMatches(editor, query, text) {
  const matches = findMatches(editor, query)
  for (let index = matches.length - 1; index >= 0; index -= 1) {
    replaceMatch(editor, matches[index], text)
  }
}
