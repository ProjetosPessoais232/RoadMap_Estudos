import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Highlighter, Link2 } from 'lucide-react'

export default function BubbleToolbar({ editor }) {
  const [coords, setCoords] = useState(null)
  const [linkOpen, setLinkOpen] = useState(false)
  const [href, setHref] = useState('')
  const [, setTick] = useState(0)
  const rootRef = useRef(null)
  const rangeRef = useRef(null)
  const hideTimer = useRef(0)

  useEffect(() => {
    if (!editor) return undefined
    const bump = () => setTick((value) => value + 1)
    editor.on('transaction', bump)
    editor.on('selectionUpdate', bump)
    return () => {
      editor.off('transaction', bump)
      editor.off('selectionUpdate', bump)
    }
  }, [editor])

  useLayoutEffect(() => {
    if (!editor) return undefined

    function place() {
      if (editor.isDestroyed || !editor.isEditable) {
        setCoords(null)
        return
      }
      const { from, to, empty } = editor.state.selection
      if (empty) {
        setCoords(null)
        setLinkOpen(false)
        return
      }
      try {
        const start = editor.view.coordsAtPos(from)
        const end = editor.view.coordsAtPos(to)
        const left = (start.left + end.left) / 2
        const top = Math.min(start.top, end.top)
        setCoords({
          top: Math.max(12, top - 8),
          left: Math.min(window.innerWidth - 24, Math.max(24, left)),
        })
      } catch {
        setCoords(null)
      }
    }

    function onBlur({ event }) {
      const next = event?.relatedTarget
      if (next && rootRef.current?.contains(next)) return
      window.clearTimeout(hideTimer.current)
      hideTimer.current = window.setTimeout(() => {
        if (!editor.view.hasFocus() && !rootRef.current?.contains(document.activeElement)) {
          setCoords(null)
          setLinkOpen(false)
        }
      }, 120)
    }

    place()
    editor.on('selectionUpdate', place)
    editor.on('transaction', place)
    editor.on('blur', onBlur)
    editor.on('focus', place)
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    return () => {
      window.clearTimeout(hideTimer.current)
      editor.off('selectionUpdate', place)
      editor.off('transaction', place)
      editor.off('blur', onBlur)
      editor.off('focus', place)
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('resize', place)
    }
  }, [editor])

  useEffect(() => {
    const node = rootRef.current
    if (!node || !editor) return undefined

    function onPointerDown(event) {
      const button = event.target.closest('[data-note-mark]')
      if (!button || event.button !== 0) return
      event.preventDefault()
      event.stopPropagation()
      const { from, to } = editor.state.selection
      rangeRef.current = { from, to }
      const mark = button.getAttribute('data-note-mark')
      const chain = editor.chain().setTextSelection({ from, to })
      if (mark === 'bold') chain.toggleBold().run()
      else if (mark === 'italic') chain.toggleItalic().run()
      else if (mark === 'strike') chain.toggleStrike().run()
      else if (mark === 'highlight') chain.toggleHighlight({ color: '#fef401' }).run()
      else if (mark === 'callout') chain.insertCallout('important').run()
      else if (mark === 'link') {
        setHref(editor.getAttributes('link').href || '#o-que-vai-no-construtor')
        setLinkOpen((open) => !open)
      }
    }

    node.addEventListener('pointerdown', onPointerDown)
    return () => node.removeEventListener('pointerdown', onPointerDown)
  }, [editor, coords, linkOpen])

  if (!editor || !coords) return null

  const host = document.getElementById('root')
  if (!host) return null

  return createPortal(
    <div
      ref={rootRef}
      className="note-bubble"
      style={{ top: coords.top, left: coords.left }}
      onPointerDown={(event) => {
        if (event.target.closest('input')) return
        event.preventDefault()
      }}
    >
      <button className={`note-icon-btn ${editor.isActive('bold') ? 'is-on' : ''}`} type="button" data-note-mark="bold" aria-label="Negrito">
        B
      </button>
      <button className={`note-icon-btn ${editor.isActive('italic') ? 'is-on' : ''}`} type="button" data-note-mark="italic" aria-label="Itálico">
        I
      </button>
      <button className={`note-icon-btn ${editor.isActive('strike') ? 'is-on' : ''}`} type="button" data-note-mark="strike" aria-label="Tachado">
        S
      </button>
      <button className={`note-icon-btn ${editor.isActive('highlight') ? 'is-on' : ''}`} type="button" data-note-mark="highlight" aria-label="Realce">
        <Highlighter size={14} />
      </button>
      <button className="note-icon-btn" type="button" data-note-mark="callout" aria-label="Callout">
        ⚠️
      </button>
      <button className={`note-icon-btn ${editor.isActive('link') ? 'is-on' : ''}`} type="button" data-note-mark="link" aria-label="Link">
        <Link2 size={14} />
      </button>
      {linkOpen ? (
        <form
          className="note-bubble-link"
          onSubmit={(event) => {
            event.preventDefault()
            const range = rangeRef.current || editor.state.selection
            const next = href.trim()
            const chain = editor.chain().setTextSelection(range)
            if (next) chain.setLink({ href: next }).run()
            else chain.unsetLink().run()
            setLinkOpen(false)
          }}
        >
          <input
            autoFocus
            value={href}
            placeholder="#seção"
            onPointerDown={(event) => event.stopPropagation()}
            onChange={(event) => setHref(event.target.value)}
          />
        </form>
      ) : null}
    </div>,
    host,
  )
}
