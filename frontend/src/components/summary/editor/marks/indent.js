import { Extension } from '@tiptap/core'

const TARGETS = ['paragraph', 'heading']
const STEP = 24
const MAX = 6

export const ParagraphIndent = Extension.create({
  name: 'paragraphIndent',

  addGlobalAttributes() {
    return [
      {
        types: TARGETS,
        attributes: {
          indent: {
            default: 0,
            parseHTML: (element) => {
              const raw = element.getAttribute('data-indent')
              const value = Number(raw)
              return Number.isFinite(value) ? value : 0
            },
            renderHTML: (attributes) => {
              const indent = Number(attributes.indent) || 0
              if (!indent) return {}
              return {
                'data-indent': String(indent),
                style: `padding-left: ${indent * STEP}px`,
              }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setIndent:
        (indent) =>
        ({ state, tr, dispatch }) =>
          applyIndent(state, tr, dispatch, () => Math.max(0, Math.min(MAX, indent))),
      indentBlock:
        () =>
        ({ state, tr, dispatch }) =>
          applyIndent(state, tr, dispatch, (current) => Math.min(MAX, current + 1)),
      outdentBlock:
        () =>
        ({ state, tr, dispatch }) =>
          applyIndent(state, tr, dispatch, (current) => Math.max(0, current - 1)),
    }
  },
})

function applyIndent(state, tr, dispatch, nextValue) {
  const { from, to } = state.selection
  let changed = false
  state.doc.nodesBetween(from, to, (node, pos) => {
    if (!TARGETS.includes(node.type.name)) return
    const current = Number(node.attrs.indent) || 0
    const indent = nextValue(current)
    if (indent === current) return
    tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent })
    changed = true
  })
  if (changed) dispatch?.(tr)
  return changed
}
