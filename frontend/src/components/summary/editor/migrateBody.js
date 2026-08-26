import { parseNoteBlocks, splitNotebookLines } from '../noteBlocks.js'
import { EMPTY_NOTE_DOC, EMPTY_NOTE_STICKIES, EMPTY_NOTE_TITLE } from './seedDoc.js'

export { EMPTY_NOTE_DOC, EMPTY_NOTE_STICKIES, EMPTY_NOTE_TITLE }

export function serializeNoteDoc(doc, stickies = []) {
  const json = doc && typeof doc === 'object' ? doc : EMPTY_NOTE_DOC
  return JSON.stringify({
    ...json,
    attrs: {
      ...(json.attrs || {}),
      stickies,
    },
  })
}

export function parseStoredBody(body) {
  if (body == null || body === '') {
    return cloneDoc(EMPTY_NOTE_DOC)
  }
  if (typeof body === 'object' && body.type === 'doc') {
    return normalizeDoc(body)
  }
  const text = String(body)
  try {
    const json = JSON.parse(text)
    if (json && json.type === 'doc') {
      return normalizeDoc(json)
    }
  } catch {
    /* plain text */
  }
  return migratePlainBody(text)
}

export function readStickies(doc) {
  const list = doc?.attrs?.stickies
  return Array.isArray(list) ? list : []
}

function cloneDoc(doc) {
  return JSON.parse(JSON.stringify(doc))
}

function normalizeDoc(doc) {
  const stickies = Array.isArray(doc.attrs?.stickies) ? doc.attrs.stickies : []
  const content = Array.isArray(doc.content) && doc.content.length ? doc.content : [{ type: 'paragraph' }]
  return {
    ...doc,
    attrs: { ...(doc.attrs || {}), stickies },
    content,
  }
}

function migratePlainBody(text) {
  const blocks = parseNoteBlocks(text)
  const content = []
  for (const block of blocks) {
    if (block.type === 'code') {
      content.push({
        type: 'codeBlock',
        attrs: { language: block.language || 'text' },
        content: block.content ? [{ type: 'text', text: block.content }] : [],
      })
      continue
    }
    for (const line of splitNotebookLines(block.content)) {
      content.push(
        line
          ? { type: 'paragraph', content: [{ type: 'text', text: line }] }
          : { type: 'paragraph' },
      )
    }
  }
  return {
    type: 'doc',
    attrs: { stickies: [] },
    content: content.length ? content : [{ type: 'paragraph' }],
  }
}
