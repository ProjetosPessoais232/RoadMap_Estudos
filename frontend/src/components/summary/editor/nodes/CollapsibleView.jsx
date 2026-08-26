import { NodeViewContent, NodeViewWrapper } from '@tiptap/react'
import { ChevronDown } from 'lucide-react'

export default function CollapsibleView({ node, updateAttributes, editor }) {
  const open = node.attrs.open !== false
  const hidden = countBlocks(node.content)
  const editable = editor?.isEditable

  return (
    <NodeViewWrapper className={`note-collapse ${open ? 'is-open' : ''}`}>
      <div className="note-collapse-head" contentEditable={false}>
        <button
          className="note-collapse-toggle"
          type="button"
          aria-expanded={open}
          onClick={() => updateAttributes({ open: !open })}
        >
          <ChevronDown size={12} strokeWidth={2.4} />
        </button>
        <input
          className="note-collapse-title"
          value={node.attrs.title || ''}
          readOnly={!editable}
          aria-label="Título da seção"
          onChange={(event) => updateAttributes({ title: event.target.value })}
        />
        <span className="note-collapse-count">({hidden} blocos)</span>
      </div>
      <div className="note-collapse-clip">
        <div className="note-collapse-inner">
          <NodeViewContent />
        </div>
      </div>
    </NodeViewWrapper>
  )
}

function countBlocks(fragment) {
  let count = 0
  fragment?.forEach?.(() => {
    count += 1
  })
  return count
}
