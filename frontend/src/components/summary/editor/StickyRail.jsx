import { useLayoutEffect, useState } from 'react'

export default function StickyRail({ stickies, paneRef, onChange, onRemove, onAdd }) {
  return (
    <div
      className="note-stickies"
      aria-label="Notas da margem"
      onClick={(event) => {
        if (event.target === event.currentTarget) onAdd?.()
      }}
    >
      {(stickies || []).map((sticky, index) => (
        <StickyCard
          key={sticky.id}
          sticky={sticky}
          index={index}
          paneRef={paneRef}
          onChange={onChange}
          onRemove={onRemove}
        />
      ))}
    </div>
  )
}

function StickyCard({ sticky, index, paneRef, onChange, onRemove }) {
  const [top, setTop] = useState(8 + index * 136)
  const [leaving, setLeaving] = useState(false)

  useLayoutEffect(() => {
    const pane = paneRef?.current
    if (!pane || !sticky.blockId) {
      setTop(8 + index * 136)
      return undefined
    }
    const target = pane.querySelector(`[data-block-id="${sticky.blockId}"]`)
    if (!target) {
      setTop(8 + index * 136)
      return undefined
    }
    function measure() {
      const paneBox = pane.getBoundingClientRect()
      const box = target.getBoundingClientRect()
      setTop(Math.max(8, box.top - paneBox.top + pane.scrollTop))
    }
    measure()
    pane.addEventListener('scroll', measure, { passive: true })
    const observer = new ResizeObserver(measure)
    observer.observe(pane)
    observer.observe(target)
    return () => {
      pane.removeEventListener('scroll', measure)
      observer.disconnect()
    }
  }, [paneRef, sticky.blockId, index])

  function remove() {
    setLeaving(true)
    window.setTimeout(() => onRemove(sticky.id), 220)
  }

  return (
    <article
      className={`note-sticky ${leaving ? 'is-leaving' : ''}`}
      style={{ top, background: sticky.color || '#ffe8b3' }}
    >
      <button className="note-sticky-remove" type="button" onClick={remove} aria-label="Remover sticky">
        ×
      </button>
      <textarea
        value={sticky.text}
        placeholder="Revisar na próxima sessão…"
        onChange={(event) => onChange({ ...sticky, text: event.target.value })}
      />
    </article>
  )
}
