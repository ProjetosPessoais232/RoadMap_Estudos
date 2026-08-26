import { Extension } from '@tiptap/core'

const TARGETS = ['paragraph', 'heading']

export const LineHeight = Extension.create({
  name: 'lineHeight',

  addGlobalAttributes() {
    return [
      {
        types: TARGETS,
        attributes: {
          lineHeight: {
            default: null,
            parseHTML: (element) => element.style.lineHeight || null,
            renderHTML: (attributes) => {
              if (!attributes.lineHeight) return {}
              return { style: `line-height: ${attributes.lineHeight}` }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setLineHeight:
        (lineHeight) =>
        ({ state, tr, dispatch }) => {
          const { from, to } = state.selection
          let changed = false
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (!TARGETS.includes(node.type.name)) return
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, lineHeight })
            changed = true
          })
          if (changed) dispatch?.(tr)
          return changed
        },
    }
  },
})
