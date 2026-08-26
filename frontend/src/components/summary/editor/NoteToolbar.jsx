import { useEffect, useState } from 'react'
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Focus,
  Highlighter,
  Indent,
  Italic,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  Outdent,
  Quote,
  Redo2,
  Search,
  Strikethrough,
  Table,
  Underline as UnderlineIcon,
  Undo2,
} from 'lucide-react'
import { FONTS, HIGHLIGHTS, TEXT_COLORS } from './toolbarMeta.js'

export default function NoteToolbar({ editor, onUndo, onRedo, onFind, onFocus }) {
  useEditorTick(editor)
  if (!editor) return null
  const fontSize = parseSize(editor.getAttributes('textStyle').fontSize) || 16
  const lineHeight = Number(editor.getAttributes('paragraph').lineHeight || editor.getAttributes('heading').lineHeight || 1.7)
  const inTable = editor.isActive('table')
  const currentFont = editor.getAttributes('textStyle').fontFamily || ''

  return (
    <div className="note-toolbar">
      <button className="note-icon-btn" type="button" aria-label="Desfazer" onClick={() => { editor.chain().focus().undo().run(); onUndo?.() }}>
        <Undo2 size={15} />
      </button>
      <button className="note-icon-btn" type="button" aria-label="Refazer" onClick={() => { editor.chain().focus().redo().run(); onRedo?.() }}>
        <Redo2 size={15} />
      </button>
      <span className="note-toolbar-sep" />
      <MarkBtn active={editor.isActive('bold')} label="Negrito" onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold size={15} />
      </MarkBtn>
      <MarkBtn active={editor.isActive('italic')} label="Itálico" onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic size={15} />
      </MarkBtn>
      <MarkBtn active={editor.isActive('underline')} label="Sublinhado" onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <UnderlineIcon size={15} />
      </MarkBtn>
      <MarkBtn active={editor.isActive('strike')} label="Tachado" onClick={() => editor.chain().focus().toggleStrike().run()}>
        <Strikethrough size={15} />
      </MarkBtn>
      <label className="note-slider">
        <span>Aa</span>
        <input
          type="range"
          min="12"
          max="32"
          value={fontSize}
          onChange={(event) => editor.chain().focus().setFontSize(`${event.target.value}px`).run()}
        />
        <em>{fontSize}</em>
      </label>
      <div className="note-font-chips">
        {FONTS.map((font) => (
          <button
            key={font.id}
            className={`note-chip ${currentFont === font.value ? 'is-on' : ''}`}
            type="button"
            style={{ fontFamily: font.value }}
            onClick={() => editor.chain().focus().setFontFamily(font.value).run()}
          >
            {font.label}
          </button>
        ))}
      </div>
      <div className="note-swatches">
        {TEXT_COLORS.map((color) => (
          <button
            key={color}
            className={`note-swatch ${editor.isActive('textStyle', { color }) ? 'is-on' : ''}`}
            type="button"
            style={{ background: color }}
            aria-label={`Cor ${color}`}
            onClick={() => editor.chain().focus().setColor(color).run()}
          />
        ))}
      </div>
      <div className="note-swatches">
        {HIGHLIGHTS.map((color) => (
          <button
            key={color}
            className={`note-swatch is-mark ${editor.isActive('highlight', { color }) ? 'is-on' : ''}`}
            type="button"
            style={{ background: color }}
            aria-label={`Realce ${color}`}
            onClick={() => editor.chain().focus().toggleHighlight({ color }).run()}
          >
            <Highlighter size={10} />
          </button>
        ))}
      </div>
      <span className="note-toolbar-sep" />
      <MarkBtn active={editor.isActive({ textAlign: 'left' })} label="Alinhar à esquerda" onClick={() => editor.chain().focus().setTextAlign('left').run()}>
        <AlignLeft size={15} />
      </MarkBtn>
      <MarkBtn active={editor.isActive({ textAlign: 'center' })} label="Centralizar" onClick={() => editor.chain().focus().setTextAlign('center').run()}>
        <AlignCenter size={15} />
      </MarkBtn>
      <MarkBtn active={editor.isActive({ textAlign: 'right' })} label="Alinhar à direita" onClick={() => editor.chain().focus().setTextAlign('right').run()}>
        <AlignRight size={15} />
      </MarkBtn>
      <MarkBtn active={editor.isActive({ textAlign: 'justify' })} label="Justificar" onClick={() => editor.chain().focus().setTextAlign('justify').run()}>
        <AlignJustify size={15} />
      </MarkBtn>
      <label className="note-slider">
        <span>LH</span>
        <input
          type="range"
          min="1.2"
          max="2"
          step="0.1"
          value={Number.isFinite(lineHeight) ? lineHeight : 1.7}
          onChange={(event) => editor.chain().focus().setLineHeight(event.target.value).run()}
        />
      </label>
      <MarkBtn label="Recuar" onClick={() => editor.chain().focus().outdentBlock().run()}>
        <Outdent size={15} />
      </MarkBtn>
      <MarkBtn label="Indentar" onClick={() => editor.chain().focus().indentBlock().run()}>
        <Indent size={15} />
      </MarkBtn>
      <MarkBtn label="Divisor" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        <Minus size={15} />
      </MarkBtn>
      <span className="note-toolbar-sep" />
      <MarkBtn active={editor.isActive('bulletList')} label="Lista" onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List size={15} />
      </MarkBtn>
      <MarkBtn active={editor.isActive('orderedList')} label="Lista numerada" onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered size={15} />
      </MarkBtn>
      <MarkBtn active={editor.isActive('taskList')} label="Checklist" onClick={() => editor.chain().focus().toggleTaskList().run()}>
        <ListChecks size={15} />
      </MarkBtn>
      <MarkBtn active={editor.isActive('blockquote')} label="Citação" onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <Quote size={15} />
      </MarkBtn>
      <MarkBtn label="Tabela" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
        <Table size={15} />
      </MarkBtn>
      {inTable ? (
        <>
          <button className="note-chip" type="button" onClick={() => editor.chain().focus().addRowAfter().run()}>
            + linha
          </button>
          <button className="note-chip" type="button" onClick={() => editor.chain().focus().addColumnAfter().run()}>
            + col
          </button>
          <button className="note-chip" type="button" onClick={() => editor.chain().focus().deleteTable().run()}>
            apagar tabela
          </button>
        </>
      ) : null}
      <span className="note-toolbar-sep" />
      <MarkBtn label="Buscar" onClick={onFind}>
        <Search size={15} />
      </MarkBtn>
      <MarkBtn label="Modo foco" onClick={onFocus}>
        <Focus size={15} />
      </MarkBtn>
    </div>
  )
}

function MarkBtn({ active, label, onClick, children }) {
  return (
    <button className={`note-icon-btn ${active ? 'is-on' : ''}`} type="button" aria-label={label} title={label} onClick={onClick}>
      {children}
    </button>
  )
}

function parseSize(value) {
  const match = String(value || '').match(/(\d+)/)
  return match ? Number(match[1]) : 0
}

function useEditorTick(editor) {
  const [, setTick] = useState(0)
  useEffect(() => {
    if (!editor) return undefined
    const update = () => setTick((value) => value + 1)
    editor.on('transaction', update)
    editor.on('selectionUpdate', update)
    return () => {
      editor.off('transaction', update)
      editor.off('selectionUpdate', update)
    }
  }, [editor])
}
