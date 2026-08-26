import { useEffect, useMemo, useRef, useState } from 'react'
import { slashItems } from './commands.js'

export default function SlashMenu({ editor, onSticky }) {
  const [query, setQuery] = useState(null)
  const [index, setIndex] = useState(0)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const openRef = useRef(false)
  const items = useMemo(() => slashItems({ onSticky }).filter((item) => !item.hidden), [onSticky])
  const visible = useMemo(() => {
    if (query == null) return []
    const needle = query.toLowerCase()
    return items.filter((item) => `${item.label} ${item.hint}`.toLowerCase().includes(needle))
  }, [items, query])

  useEffect(() => {
    if (!editor) return undefined

    function readSlash() {
      const { selection } = editor.state
      if (!selection.empty) {
        openRef.current = false
        setQuery(null)
        return
      }
      const { $from } = selection
      const text = $from.parent.textBetween(0, $from.parentOffset, null, '\n')
      const match = /(?:^|\s)\/([^\s]*)$/.exec(text)
      if (!match) {
        openRef.current = false
        setQuery(null)
        return
      }
      const needle = match[1] || ''
      if (!openRef.current) {
        openRef.current = true
        const todo = items.findIndex((item) => item.key === 'task')
        setIndex(needle ? 0 : Math.max(todo, 0))
      }
      setQuery(needle)
      try {
        const box = editor.view.coordsAtPos($from.pos)
        setCoords({ top: box.bottom + 8, left: box.left })
      } catch {
        /* ignore */
      }
    }

    editor.on('selectionUpdate', readSlash)
    editor.on('update', readSlash)
    return () => {
      editor.off('selectionUpdate', readSlash)
      editor.off('update', readSlash)
    }
  }, [editor, items])

  useEffect(() => {
    if (query == null) return undefined
    function onKey(event) {
      if (!visible.length) return
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setIndex((current) => (current + 1) % visible.length)
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        setIndex((current) => (current - 1 + visible.length) % visible.length)
      } else if (event.key === 'Enter') {
        event.preventDefault()
        apply(visible[index])
      } else if (event.key === 'Escape') {
        setQuery(null)
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [query, visible, index, editor])

  function apply(item) {
    if (!editor || !item) return
    const { $from } = editor.state.selection
    const text = $from.parent.textBetween(0, $from.parentOffset, null, '\n')
    const match = /(?:^|\s)\/([^\s]*)$/.exec(text)
    if (match) {
      const from = $from.pos - match[0].trimStart().length
      editor.chain().focus().deleteRange({ from, to: $from.pos }).run()
    }
    item.run(editor)
    setQuery(null)
  }

  if (query == null || !visible.length) return null

  return (
    <div className="note-slash" style={{ top: coords.top, left: coords.left }} role="listbox">
      {visible.map((item, itemIndex) => (
        <button
          key={item.key}
          className={`note-slash-item ${itemIndex === index ? 'is-active' : ''}`}
          type="button"
          onMouseDown={(event) => {
            event.preventDefault()
            apply(item)
          }}
        >
          <span>{item.label}</span>
          <span className="note-slash-hint">{item.hint}</span>
        </button>
      ))}
    </div>
  )
}
