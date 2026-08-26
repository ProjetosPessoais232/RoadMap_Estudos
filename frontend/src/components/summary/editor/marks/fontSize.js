import { Extension } from '@tiptap/core'

function cssSize(value) {
  if (value == null || value === '') return null
  const raw = String(value).trim()
  if (!raw) return null
  return /^\d+$/.test(raw) ? `${raw}px` : raw
}

export const FontSize = Extension.create({
  name: 'fontSize',

  addOptions() {
    return { types: ['textStyle'] }
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize || null,
            renderHTML: (attributes) => {
              const size = cssSize(attributes.fontSize)
              if (!size) return {}
              return { style: `font-size: ${size}` }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setFontSize:
        (fontSize) =>
        ({ chain }) =>
          chain().setMark('textStyle', { fontSize: cssSize(fontSize) }).run(),
      unsetFontSize:
        () =>
        ({ chain }) =>
          chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run(),
    }
  },
})
