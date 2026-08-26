import { Extension } from '@tiptap/core'

export const ParagraphKicker = Extension.create({
  name: 'paragraphKicker',

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph'],
        attributes: {
          kicker: {
            default: false,
            parseHTML: (element) => element.classList.contains('note-kicker'),
            renderHTML: (attributes) => (attributes.kicker ? { class: 'note-kicker' } : {}),
          },
        },
      },
    ]
  },
})
