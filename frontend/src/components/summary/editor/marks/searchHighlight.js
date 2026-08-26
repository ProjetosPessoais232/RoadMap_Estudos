import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

function collectHits(doc, query) {
  const needle = String(query || '').toLowerCase()
  if (!needle) return []
  const hits = []
  doc.descendants((node, pos) => {
    if (!node.isText) return
    const hay = node.text.toLowerCase()
    let from = 0
    while (from < hay.length) {
      const index = hay.indexOf(needle, from)
      if (index === -1) break
      hits.push({ from: pos + index, to: pos + index + needle.length })
      from = index + needle.length
    }
  })
  return hits
}

export const SearchHighlight = Extension.create({
  name: 'searchHighlight',

  addStorage() {
    return { query: '' }
  },

  addCommands() {
    return {
      setSearchQuery:
        (query) =>
        ({ tr, dispatch }) => {
          this.storage.query = String(query || '')
          dispatch?.(tr.setMeta('searchHighlight', this.storage.query))
          return true
        },
    }
  },

  addProseMirrorPlugins() {
    const extension = this
    return [
      new Plugin({
        key: new PluginKey('searchHighlight'),
        props: {
          decorations(state) {
            const query = extension.storage.query
            const hits = collectHits(state.doc, query)
            if (!hits.length) return DecorationSet.empty
            return DecorationSet.create(
              state.doc,
              hits.map((hit) => Decoration.inline(hit.from, hit.to, { class: 'note-search-hit' })),
            )
          },
        },
      }),
    ]
  },
})
