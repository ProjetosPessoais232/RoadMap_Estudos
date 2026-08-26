import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { Color } from '@tiptap/extension-color'
import TextStyle from '@tiptap/extension-text-style'
import FontFamily from '@tiptap/extension-font-family'
import Highlight from '@tiptap/extension-highlight'
import TextAlign from '@tiptap/extension-text-align'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import Link from '@tiptap/extension-link'
import { FontSize } from './marks/fontSize.js'
import { LineHeight } from './marks/lineHeight.js'
import { ParagraphIndent } from './marks/indent.js'
import { BlockId } from './marks/blockId.js'
import { HeadingId } from './marks/headingId.js'
import { ParagraphKicker } from './marks/kicker.js'
import { SearchHighlight } from './marks/searchHighlight.js'
import { Callout } from './nodes/Callout.js'
import { CollapsibleSection } from './nodes/CollapsibleSection.js'
import { NoteCodeBlock } from './nodes/NoteCodeBlock.js'

export function createNoteExtensions({ placeholder = 'Anote aqui, como num caderno…' } = {}) {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      codeBlock: false,
      horizontalRule: true,
    }),
    NoteCodeBlock.configure({
      defaultLanguage: 'text',
    }),
    Underline,
    TextStyle,
    Color,
    FontFamily,
    FontSize,
    Highlight.configure({ multicolor: true }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    LineHeight,
    ParagraphIndent,
    Table.configure({ resizable: false }),
    TableRow,
    TableHeader,
    TableCell,
    TaskList,
    TaskItem.configure({ nested: true }),
    Link.configure({
      openOnClick: false,
      autolink: true,
      HTMLAttributes: { class: 'note-inline-link' },
    }),
    Placeholder.configure({ placeholder }),
    CharacterCount,
    Callout,
    CollapsibleSection,
    HeadingId,
    ParagraphKicker,
    SearchHighlight,
    BlockId,
  ]
}
