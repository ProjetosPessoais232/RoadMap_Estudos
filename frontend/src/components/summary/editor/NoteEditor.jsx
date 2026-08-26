import { useEditor, EditorContent } from '@tiptap/react'
import { useEffect } from 'react'
import BubbleToolbar from './BubbleToolbar.jsx'
import { createNoteExtensions } from './noteSchema.js'
import SlashMenu from './SlashMenu.jsx'

export default function NoteEditor({
  initialContent,
  editable = true,
  onChange,
  onReady,
  onWords,
  onHistoryToast,
  onSlashSticky,
  placeholder,
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: createNoteExtensions({ placeholder }),
    content: initialContent,
    editable,
    editorProps: {
      attributes: {
        class: 'tiptap note-draft',
        spellcheck: 'true',
      },
    },
    onCreate: ({ editor: instance }) => {
      onReady?.(instance)
      onWords?.(instance.storage.characterCount?.words?.() ?? 0)
    },
    onUpdate: ({ editor: instance }) => {
      if (instance.isDestroyed) return
      onChange?.(instance.getJSON())
      onWords?.(instance.storage.characterCount?.words?.() ?? 0)
    },
  })

  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    editor.setEditable(editable)
  }, [editable, editor])

  useEffect(() => {
    if (!editor) return undefined
    function onKey(event) {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'z') return
      onHistoryToast?.(event.shiftKey ? 'Refeito' : 'Desfeito')
    }
    const dom = editor.view.dom
    dom.addEventListener('keydown', onKey)
    return () => dom.removeEventListener('keydown', onKey)
  }, [editor, onHistoryToast])

  useEffect(
    () => () => {
      onReady?.(null)
    },
    [onReady],
  )

  if (!editor) return <div className="tiptap note-draft" />

  return (
    <>
      <EditorContent editor={editor} />
      {editable ? (
        <>
          <BubbleToolbar editor={editor} />
          <SlashMenu editor={editor} onSticky={onSlashSticky} />
        </>
      ) : null}
    </>
  )
}
