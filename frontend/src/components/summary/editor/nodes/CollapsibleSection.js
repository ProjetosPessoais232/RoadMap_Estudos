import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import CollapsibleView from './CollapsibleView.jsx'

export const CollapsibleSection = Node.create({
  name: 'collapsibleSection',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      title: {
        default: 'Seção',
        parseHTML: (element) => element.getAttribute('data-title') || 'Seção',
        renderHTML: (attributes) => ({ 'data-title': attributes.title || 'Seção' }),
      },
      open: {
        default: true,
        parseHTML: (element) => element.getAttribute('data-open') !== 'false',
        renderHTML: (attributes) => ({ 'data-open': attributes.open === false ? 'false' : 'true' }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div.note-collapse' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { class: 'note-collapse' }), 0]
  },

  addCommands() {
    return {
      insertCollapsible:
        (title = 'Seção') =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { title, open: true },
            content: [{ type: 'paragraph' }],
          }),
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(CollapsibleView)
  },
})
