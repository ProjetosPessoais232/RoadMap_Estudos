import { NodeViewContent, NodeViewWrapper } from '@tiptap/react'
import { CALLOUT_VARIANTS } from './Callout.js'

export default function CalloutView({ node, updateAttributes, editor }) {
  const variant = CALLOUT_VARIANTS[node.attrs.variant] ? node.attrs.variant : 'tip'
  const meta = CALLOUT_VARIANTS[variant]
  const editable = editor?.isEditable

  return (
    <NodeViewWrapper className={`note-callout is-${variant}`} data-variant={variant}>
      <div className="note-callout-head" contentEditable={false}>
        <span className="note-callout-icon" aria-hidden="true">
          {meta.icon}
        </span>
        <select
          className="note-callout-select"
          value={variant}
          disabled={!editable}
          aria-label="Tipo do destaque"
          onChange={(event) => updateAttributes({ variant: event.target.value })}
        >
          {Object.entries(CALLOUT_VARIANTS).map(([key, item]) => (
            <option key={key} value={key}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
      <NodeViewContent className="note-callout-body" />
    </NodeViewWrapper>
  )
}
