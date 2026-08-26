import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import CalloutView from './CalloutView.jsx'

export const CALLOUT_VARIANTS = {
  attention: { label: 'Atenção', icon: '⚠️' },
  tip: { label: 'Dica', icon: '💡' },
  important: { label: 'Importante', icon: '⚠️' },
}

export const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  defining: true,
  draggable: true,

  addAttributes() {
    return {
      variant: {
        default: 'important',
        parseHTML: (element) => element.getAttribute('data-variant') || 'important',
        renderHTML: (attributes) => ({ 'data-variant': attributes.variant || 'important' }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div.note-callout' }]
  },

  renderHTML({ HTMLAttributes }) {
    const variant = HTMLAttributes['data-variant'] || 'important'
    return ['div', mergeAttributes(HTMLAttributes, { class: `note-callout is-${variant}` }), 0]
  },

  addCommands() {
    return {
      insertCallout:
        (variant = 'important') =>
        ({ commands }) =>
          commands.wrapIn(this.name, { variant }) ||
          commands.insertContent({
            type: this.name,
            attrs: { variant },
            content: [{ type: 'paragraph' }],
          }),
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutView)
  },
})
