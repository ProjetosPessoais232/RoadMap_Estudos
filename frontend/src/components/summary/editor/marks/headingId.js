import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

function slugify(text) {
  const base = String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return base || 'secao'
}

function uniqueId(base, used) {
  if (!used.has(base)) return base
  let index = 2
  while (used.has(`${base}-${index}`)) index += 1
  return `${base}-${index}`
}

export const HeadingId = Extension.create({
  name: 'headingId',

  addGlobalAttributes() {
    return [
      {
        types: ['heading'],
        attributes: {
          id: {
            default: null,
            parseHTML: (element) => element.getAttribute('id'),
            renderHTML: (attributes) => (attributes.id ? { id: attributes.id } : {}),
          },
        },
      },
    ]
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('headingId'),
        appendTransaction(transactions, _oldState, newState) {
          if (!transactions.some((transaction) => transaction.docChanged)) return null
          const used = new Set()
          let next = null
          newState.doc.descendants((node, pos) => {
            if (node.type.name !== 'heading') return
            let id = node.attrs.id
            if (!id || used.has(id)) {
              id = uniqueId(slugify(node.textContent), used)
              next = next || newState.tr
              next.setNodeMarkup(pos, undefined, { ...node.attrs, id })
            }
            used.add(id)
          })
          if (!next) return null
          next.setMeta('addToHistory', false)
          return next
        },
      }),
      headingAnchorPlugin(),
    ]
  },
})

const copiedAnchors = new Set()

function headingAnchorPlugin() {
  return new Plugin({
    key: new PluginKey('headingAnchor'),
    props: {
      decorations(state) {
        const widgets = []
        state.doc.descendants((node, pos) => {
          if (node.type.name !== 'heading' || node.attrs.level < 2 || !node.attrs.id) return
          const id = node.attrs.id
          widgets.push(
            Decoration.widget(
              pos + 1,
              (view) => {
                const button = document.createElement('button')
                button.type = 'button'
                button.className = 'note-heading-anchor'
                button.textContent = copiedAnchors.has(id) ? '✓' : '#'
                button.setAttribute('aria-label', 'Copiar âncora')
                button.addEventListener('mousedown', (event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  const url = `${window.location.href.split('#')[0]}#${id}`
                  window.navigator.clipboard?.writeText(url).catch(() => {})
                  copiedAnchors.add(id)
                  button.textContent = '✓'
                  window.setTimeout(() => {
                    copiedAnchors.delete(id)
                    view.dispatch(view.state.tr.setMeta('headingAnchor', id))
                  }, 1200)
                })
                return button
              },
              { side: -1, key: `anchor-${id}` },
            ),
          )
        })
        return DecorationSet.create(state.doc, widgets)
      },
    },
  })
}

export function listHeadingAnchors(editor) {
  if (!editor) return []
  const headings = []
  editor.state.doc.descendants((node) => {
    if (node.type.name !== 'heading' || !node.attrs.id) return
    headings.push({
      id: node.attrs.id,
      level: node.attrs.level,
      text: node.textContent || 'Seção',
    })
  })
  return headings
}
