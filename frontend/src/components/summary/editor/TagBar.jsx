import { useEffect, useState } from 'react'
import { TAG_COLORS } from './toolbarMeta.js'

export default function TagBar({ tags, onChange, requestAdd, onConsumeAdd }) {
  const [draft, setDraft] = useState('')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!requestAdd) return
    setOpen(true)
    onConsumeAdd?.()
  }, [requestAdd, onConsumeAdd])

  function commit() {
    const label = draft.trim()
    if (!label) {
      setOpen(false)
      setDraft('')
      return
    }
    const color = TAG_COLORS[(tags?.length || 0) % TAG_COLORS.length]
    onChange([
      ...(tags || []),
      { id: `t_${Date.now().toString(36)}`, label: label.slice(0, 32), color },
    ])
    setDraft('')
    setOpen(false)
  }

  return (
    <div className="note-tags">
      {(tags || []).map((tag) => (
        <span key={tag.id} className="note-tag" style={{ background: tag.color || TAG_COLORS[0] }}>
          {tag.label}
          <button
            type="button"
            aria-label={`Remover ${tag.label}`}
            onClick={() => onChange(tags.filter((item) => item.id !== tag.id))}
          >
            ×
          </button>
        </span>
      ))}
      {open ? (
        <input
          className="note-tag-input"
          autoFocus
          value={draft}
          maxLength={32}
          placeholder="Etiqueta"
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') commit()
            if (event.key === 'Escape') {
              setOpen(false)
              setDraft('')
            }
          }}
        />
      ) : (
        <button className="note-tag-add" type="button" onClick={() => setOpen(true)}>
          +
        </button>
      )}
    </div>
  )
}
