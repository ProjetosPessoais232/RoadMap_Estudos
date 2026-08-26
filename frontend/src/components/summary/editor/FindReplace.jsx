import { useEffect, useState } from 'react'
import { findMatches, replaceAllMatches, replaceMatch, selectMatch } from './commands.js'

export default function FindReplace({ editor, previewEditor, open, onClose }) {
  const [query, setQuery] = useState('')
  const [replace, setReplace] = useState('')
  const [index, setIndex] = useState(0)
  const matches = findMatches(editor, query)

  useEffect(() => {
    if (!open) {
      editor?.commands.setSearchQuery('')
      previewEditor?.commands.setSearchQuery('')
      setQuery('')
      return
    }
    editor?.commands.setSearchQuery(query)
    previewEditor?.commands.setSearchQuery(query)
  }, [open, query, editor, previewEditor])

  useEffect(() => {
    setIndex(0)
    const next = findMatches(editor, query)
    if (open && next[0]) selectMatch(editor, next[0])
  }, [query, editor, open])

  useEffect(() => {
    if (!open) return undefined
    function onKey(event) {
      if (event.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  function go(delta) {
    if (!matches.length) return
    const next = (index + delta + matches.length) % matches.length
    setIndex(next)
    selectMatch(editor, matches[next])
  }

  function onReplace() {
    const current = matches[index]
    if (!current) return
    replaceMatch(editor, current, replace)
    const next = findMatches(editor, query)
    const nextIndex = Math.min(index, Math.max(next.length - 1, 0))
    setIndex(nextIndex)
    if (next[nextIndex]) selectMatch(editor, next[nextIndex])
  }

  return (
    <div className="note-find">
      <input
        autoFocus
        value={query}
        placeholder="Buscar na nota…"
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') go(event.shiftKey ? -1 : 1)
        }}
      />
      <input
        value={replace}
        placeholder="Substituir"
        onChange={(event) => setReplace(event.target.value)}
      />
      <span className="note-find-count">
        {matches.length ? `${index + 1}/${matches.length}` : '0/0'}
      </span>
      <button className="note-chip" type="button" onClick={() => go(-1)}>
        Anterior
      </button>
      <button className="note-chip" type="button" onClick={() => go(1)}>
        Próximo
      </button>
      <button className="note-chip" type="button" onClick={onReplace} disabled={!matches.length}>
        Substituir
      </button>
      <button
        className="note-chip"
        type="button"
        disabled={!matches.length}
        onClick={() => replaceAllMatches(editor, query, replace)}
      >
        Todos
      </button>
    </div>
  )
}
