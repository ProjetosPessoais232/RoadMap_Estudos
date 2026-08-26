import { useEditor, EditorContent } from '@tiptap/react'
import { useEffect } from 'react'
import { createNoteExtensions } from './noteSchema.js'

export default function NotePreview({ content, exportRef, onReady }) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: createNoteExtensions({ placeholder: '' }),
    content,
    editable: false,
    editorProps: {
      attributes: { class: 'tiptap note-fair' },
    },
    onCreate: ({ editor: instance }) => onReady?.(instance),
  })

  useEffect(() => {
    if (!editor || !content) return
    editor.commands.setContent(content, false)
  }, [content, editor])

  useEffect(
    () => () => {
      onReady?.(null)
    },
    [onReady],
  )

  useEffect(() => {
    if (!editor) return undefined
    const root = editor.view.dom
    function onClick(event) {
      const link = event.target.closest?.('a[href^="#"]')
      if (!link) return
      const hash = link.getAttribute('href') || ''
      const id = decodeURIComponent(hash.replace('#', ''))
      if (!id) return
      event.preventDefault()
      const target = root.querySelector(`#${CSS.escape(id)}`)
      if (!target) return
      target.scrollIntoView({ behavior: 'smooth', block: 'center' })
      target.classList.add('is-anchor-hit')
      window.setTimeout(() => target.classList.remove('is-anchor-hit'), 1800)
    }
    root.addEventListener('click', onClick)
    return () => root.removeEventListener('click', onClick)
  }, [editor])

  return (
    <div className="notebook-result note-export-root" ref={exportRef}>
      {editor ? <EditorContent editor={editor} /> : null}
    </div>
  )
}
