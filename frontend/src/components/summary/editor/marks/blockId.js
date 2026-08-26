import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'

const BLOCK_TYPES = [
  'paragraph',
  'heading',
  'blockquote',
  'callout',
  'collapsibleSection',
  'codeBlock',
  'horizontalRule',
  'bulletList',
  'orderedList',
  'taskList',
  'listItem',
  'taskItem',
  'table',
]

function createId() {
  return `b_${Math.random().toString(36).slice(2, 10)}`
}

export const BlockId = Extension.create({
  name: 'blockId',

  addGlobalAttributes() {
    return [
      {
        types: BLOCK_TYPES,
        attributes: {
          blockId: {
            default: null,
            parseHTML: (element) => element.getAttribute('data-block-id'),
            renderHTML: (attributes) =>
              attributes.blockId ? { 'data-block-id': attributes.blockId } : {},
          },
        },
      },
    ]
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('blockId'),
        appendTransaction(transactions, _oldState, newState) {
          if (!transactions.some((transaction) => transaction.docChanged)) return null
          let next = null
          const seen = new Set()
          newState.doc.descendants((node, pos) => {
            if (!node.isBlock || !Object.prototype.hasOwnProperty.call(node.attrs, 'blockId')) return
            let id = node.attrs.blockId
            if (!id || seen.has(id)) {
              id = createId()
              next = next || newState.tr
              next.setNodeMarkup(pos, undefined, { ...node.attrs, blockId: id })
            }
            seen.add(id)
          })
          if (!next) return null
          next.setMeta('addToHistory', false)
          return next
        },
      }),
    ]
  },
})

export function blockIdAtSelection(editor) {
  if (!editor) return null
  const { $from } = editor.state.selection
  for (let depth = $from.depth; depth >= 0; depth -= 1) {
    const id = $from.node(depth).attrs?.blockId
    if (id) return id
  }
  return null
}
