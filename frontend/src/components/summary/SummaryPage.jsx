import { Component, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Download, Plus, Search, Sparkles, StickyNote, Trash2 } from 'lucide-react'
import { createNote, deleteNote, listNotes, updateNote } from '../../api'
import { runViewTransition } from '../../motion.js'
import SilkScroll from './SilkScroll.jsx'
import { blockIdAtSelection } from './editor/marks/blockId.js'
import { readingLabel } from './editor/commands.js'
import ExportSheet from './editor/ExportSheet.jsx'
import FindReplace from './editor/FindReplace.jsx'
import NoteAssistantSheet from './editor/NoteAssistantSheet.jsx'
import { markdownToNoteDoc } from './editor/fromMarkdown.js'
import {
  EMPTY_NOTE_DOC,
  EMPTY_NOTE_STICKIES,
  EMPTY_NOTE_TITLE,
  parseStoredBody,
  readStickies,
  serializeNoteDoc,
} from './editor/migrateBody.js'
import NoteEditor from './editor/NoteEditor.jsx'
import NotePreview from './editor/NotePreview.jsx'
import StickyRail from './editor/StickyRail.jsx'
import TagBar from './editor/TagBar.jsx'
import { noteDocToMarkdown, sliceToMarkdown } from './editor/toMarkdown.js'

function relativeDate(value) {
  if (!value) return ''
  const date = new Date(value)
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function readDock(key, fallback = true) {
  try {
    const value = localStorage.getItem(key)
    if (value === '0') return false
    if (value === '1') return true
  } catch {
    /* ignore */
  }
  return fallback
}

class NotebookErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="notebook-empty">
          <p className="summary-kicker">Página limpa</p>
          <h2 className="summary-heading mt-2">Não foi possível mostrar o resultado</h2>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-ink-secondary">
            Recarregue a anotação ou volte ao editor.
          </p>
          <button className="summary-view-btn mt-4" type="button" onClick={() => this.setState({ error: null })}>
            Tentar de novo
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

function DockButton({ open, onToggle, label, variant }) {
  return (
    <button
      className={`summary-dock is-${variant} ${open ? 'is-open' : ''}`}
      type="button"
      aria-pressed={open}
      aria-label={open ? `Ocultar ${label}` : `Mostrar ${label}`}
      title={open ? `Ocultar ${label}` : `Mostrar ${label}`}
      onClick={onToggle}
    >
      <span className="summary-dock-glyph" aria-hidden="true" />
    </button>
  )
}

export default function SummaryPage({ nodes }) {
  const [notes, setNotes] = useState([])
  const [nodeId, setNodeId] = useState(nodes[0]?.id || '')
  const [activeId, setActiveId] = useState(null)
  const [title, setTitle] = useState('')
  const [doc, setDoc] = useState(EMPTY_NOTE_DOC)
  const [tags, setTags] = useState([])
  const [stickies, setStickies] = useState([])
  const [reviewFlag, setReviewFlag] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState('')
  const [error, setError] = useState('')
  const [previewOnly, setPreviewOnly] = useState(false)
  const [findOpen, setFindOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [assistantSnap, setAssistantSnap] = useState(null)
  const [editorNonce, setEditorNonce] = useState(0)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [addTagRequest, setAddTagRequest] = useState(false)
  const [words, setWords] = useState(0)
  const [editor, setEditor] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loadedId, setLoadedId] = useState(null)
  const [showSubjects, setShowSubjects] = useState(() => readDock('paperless_summary_subjects'))
  const [showPages, setShowPages] = useState(() => readDock('paperless_summary_pages'))
  const saveTimer = useRef(0)
  const assistantOpenRef = useRef(false)
  const draftRef = useRef({ title: '', doc: EMPTY_NOTE_DOC, tags: [], stickies: [], reviewFlag: false })
  const nodeIdRef = useRef(nodeId)
  const exportRef = useRef(null)
  const previewPaneRef = useRef(null)
  const editorRef = useRef(null)

  nodeIdRef.current = nodeId
  editorRef.current = editor

  const technologies = useMemo(
    () => [...nodes].sort((a, b) => a.title.localeCompare(b.title, 'pt-BR')),
    [nodes],
  )
  const selectedNode = technologies.find((node) => node.id === nodeId) || null
  const notesForNode = notes.filter((note) => note.nodeId === nodeId)
  const active = notesForNode.find((note) => note.id === activeId) || null

  useEffect(() => {
    if (!nodeId && technologies[0]) setNodeId(technologies[0].id)
  }, [nodeId, technologies])

  useEffect(() => {
    if (loading) return
    const forNode = notes.filter((note) => note.nodeId === nodeId)
    if (activeId && forNode.some((note) => note.id === activeId)) return
    setActiveId(forNode[0]?.id ?? null)
  }, [loading, notes, nodeId, activeId])

  useEffect(() => {
    let alive = true
    setLoading(true)
    listNotes()
      .then((rows) => {
        if (!alive) return
        setNotes(rows)
        setError('')
      })
      .catch((err) => {
        if (alive) setError(err.message)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  if (activeId !== loadedId) {
    setLoadedId(activeId)
    if (!active) {
      setTitle('')
      setDoc(EMPTY_NOTE_DOC)
      setTags([])
      setStickies([])
      setReviewFlag(false)
      draftRef.current = { title: '', doc: EMPTY_NOTE_DOC, tags: [], stickies: [], reviewFlag: false }
    } else {
      const parsed = parseStoredBody(active.body)
      const nextTags = active.tags || []
      const nextStickies = readStickies(parsed)
      const nextFlag = !!active.reviewFlag
      setTitle(active.title)
      setDoc(parsed)
      setTags(nextTags)
      setStickies(nextStickies)
      setReviewFlag(nextFlag)
      draftRef.current = {
        title: active.title,
        doc: parsed,
        tags: nextTags,
        stickies: nextStickies,
        reviewFlag: nextFlag,
      }
    }
  }

  useEffect(() => () => window.clearTimeout(saveTimer.current), [])

  const queueSave = useCallback((patch) => {
    draftRef.current = { ...draftRef.current, ...patch }
    if (assistantOpenRef.current || !activeId) return
    window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(async () => {
      const current = draftRef.current
      try {
        const updated = await updateNote(activeId, {
          nodeId: nodeIdRef.current,
          title: current.title.trim() || EMPTY_NOTE_TITLE,
          body: serializeNoteDoc(current.doc, current.stickies),
          tags: current.tags,
          reviewFlag: current.reviewFlag,
        })
        setNotes((rows) => rows.map((note) => (note.id === updated.id ? updated : note)))
        setSaving('Salvo')
        window.setTimeout(() => setSaving((value) => (value === 'Salvo' ? '' : value)), 1200)
      } catch (err) {
        setError(err.message)
      }
    }, 550)
  }, [activeId])

  function flashStatus(label) {
    setSaving(label)
    window.setTimeout(() => setSaving((value) => (value === label ? '' : value)), 1200)
  }

  async function addNote() {
    if (!nodeId) {
      setError('Crie um nó no Roadmap para anotar uma tecnologia.')
      return
    }
    try {
      const created = await createNote({
        nodeId,
        title: EMPTY_NOTE_TITLE,
        body: serializeNoteDoc(EMPTY_NOTE_DOC, EMPTY_NOTE_STICKIES),
        tags: [],
        reviewFlag: false,
      })
      setNotes((current) => [created, ...current])
      setActiveId(created.id)
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }

  async function removeNote() {
    if (!activeId) return
    setConfirmRemove(false)
    try {
      await deleteNote(activeId)
      setNotes((current) => current.filter((note) => note.id !== activeId))
      setActiveId(null)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleReady = useCallback((instance) => {
    setEditor(instance)
  }, [])

  const handlePreviewReady = useCallback((instance) => {
    setPreview(instance)
  }, [])

  const handleDoc = useCallback((next) => {
    setDoc(next)
    queueSave({ doc: next })
  }, [queueSave])

  const handleStickies = useCallback((next) => {
    setStickies(next)
    queueSave({ stickies: next })
  }, [queueSave])

  const addSticky = useCallback(() => {
    const instance = editorRef.current
    const sticky = {
      id: `s_${Date.now().toString(36)}`,
      blockId: blockIdAtSelection(instance),
      color: '#ffe8b3',
      text: '',
    }
    const next = [...(draftRef.current.stickies || []), sticky]
    handleStickies(next)
  }, [handleStickies])

  function cloneNoteDoc(value) {
    return JSON.parse(JSON.stringify(value || EMPTY_NOTE_DOC))
  }

  function openAssistant() {
    if (!activeId) return
    const instance = editorRef.current
    const selectionMarkdown = sliceToMarkdown(instance)
    const range =
      instance && !instance.state.selection.empty
        ? { from: instance.state.selection.from, to: instance.state.selection.to }
        : null
    assistantOpenRef.current = true
    setAssistantSnap({
      title,
      doc: cloneNoteDoc(doc),
      stickies: [...(stickies || [])],
      sourceMarkdown: noteDocToMarkdown(doc).slice(0, 80_000),
      selectionMarkdown: selectionMarkdown.slice(0, 80_000),
      range,
    })
    setAssistantOpen(true)
  }

  function discardAssistant() {
    const snap = assistantSnap
    assistantOpenRef.current = false
    setAssistantOpen(false)
    setAssistantSnap(null)
    if (!snap) return
    setTitle(snap.title)
    setDoc(cloneNoteDoc(snap.doc))
    setStickies(snap.stickies)
    draftRef.current = {
      ...draftRef.current,
      title: snap.title,
      doc: snap.doc,
      stickies: snap.stickies,
    }
    setEditorNonce((value) => value + 1)
  }

  function approveAssistant(proposal) {
    const snap = assistantSnap
    const stickiesKeep = snap?.stickies || stickies
    const parsed = markdownToNoteDoc(proposal.markdown)
    parsed.attrs = { ...(parsed.attrs || {}), stickies: stickiesKeep }
    const range = snap?.range
    const instance = editorRef.current

    // Com seleção: troca só o intervalo {from,to} capturado em Gerar (insertContent dos blocos).
    // Sem seleção (ou se o editor não aplicar o intervalo): substitui o doc inteiro.
    let nextTitle = title
    let nextDoc = parsed
    if (range && instance && !instance.isDestroyed) {
      try {
        instance.chain().focus().deleteRange(range).insertContent(parsed.content).run()
        nextDoc = instance.getJSON()
        nextDoc.attrs = { ...(nextDoc.attrs || {}), stickies: stickiesKeep }
      } catch {
        nextTitle = proposal.title?.trim() || title
        nextDoc = parsed
        setEditorNonce((value) => value + 1)
      }
    } else {
      nextTitle = proposal.title?.trim() || title
      setEditorNonce((value) => value + 1)
    }

    assistantOpenRef.current = false
    setAssistantOpen(false)
    setAssistantSnap(null)
    setTitle(nextTitle)
    setDoc(nextDoc)
    setStickies(stickiesKeep)
    draftRef.current = {
      ...draftRef.current,
      title: nextTitle,
      doc: nextDoc,
      stickies: stickiesKeep,
    }
    queueSave({ title: nextTitle, doc: nextDoc, stickies: stickiesKeep })
  }

  useEffect(() => {
    function onKey(event) {
      const mod = event.metaKey || event.ctrlKey
      if (mod && event.key.toLowerCase() === 'f' && activeId) {
        event.preventDefault()
        setFindOpen(true)
        return
      }
      if (event.key !== 'Escape') return
      if (exportOpen) {
        setExportOpen(false)
        return
      }
      if (assistantOpen) {
        discardAssistant()
        return
      }
      if (findOpen) {
        setFindOpen(false)
        return
      }
      if (confirmRemove) {
        setConfirmRemove(false)
        return
      }
      if (previewOnly) setPreviewOnly(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activeId, exportOpen, findOpen, previewOnly, confirmRemove, assistantOpen])

  function toggleSubjects() {
    setShowSubjects((open) => {
      const next = !open
      localStorage.setItem('paperless_summary_subjects', next ? '1' : '0')
      return next
    })
  }

  function togglePages() {
    setShowPages((open) => {
      const next = !open
      localStorage.setItem('paperless_summary_pages', next ? '1' : '0')
      return next
    })
  }

  const fileName = (title || 'anotacao').replace(/[^\w\-]+/g, '_').slice(0, 60) || 'anotacao'

  return (
    <div className="summary-page flex min-h-0 flex-1">
      {!showSubjects ? (
        <div className="summary-reopen is-subjects">
          <DockButton open={false} onToggle={toggleSubjects} label="matérias" variant="subjects" />
        </div>
      ) : null}
      <div className={`summary-rail is-subjects ${showSubjects ? 'is-open' : ''}`}>
        <aside className="summary-index">
          <div className="summary-index-head">
            <p className="summary-kicker">Matérias</p>
            <DockButton open={showSubjects} onToggle={toggleSubjects} label="matérias" variant="subjects" />
          </div>
          {technologies.length === 0 ? (
            <p className="mt-3 text-[13px] leading-relaxed text-ink-tertiary">
              Ainda não há nós no roadmap. Crie uma tecnologia lá primeiro.
            </p>
          ) : (
            <SilkScroll className="summary-index-scroll">
              <ul className="space-y-2 pr-2">
                {technologies.map((node) => {
                  const count = notes.filter((note) => note.nodeId === node.id).length
                  return (
                    <li key={node.id}>
                      <button
                        className={`summary-tab ${nodeId === node.id ? 'is-active' : ''}`}
                        type="button"
                        onClick={() => {
                          runViewTransition(() => {
                            setNodeId(node.id)
                            const first = notes.find((note) => note.nodeId === node.id)
                            setActiveId(first?.id || null)
                            setPreviewOnly(false)
                          }, 'summary-leaf')
                        }}
                      >
                        <span className="truncate">{node.title}</span>
                        <span className="summary-count">{count}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </SilkScroll>
          )}
        </aside>
      </div>

      <div className={`summary-book ${exportOpen ? 'is-dim' : ''}`}>
        <div className="summary-spine" aria-hidden="true" />
        <div className={`summary-rail is-pages ${showPages ? 'is-open' : ''}`}>
          <aside className="summary-toc">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="summary-toc-kicker">
                  <p className="summary-kicker">Caderno</p>
                  <DockButton open={showPages} onToggle={togglePages} label="páginas" variant="pages" />
                </div>
                <h2 className="summary-heading">{selectedNode?.title || 'Summary'}</h2>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button className="note-icon-btn" type="button" title="Nota na margem" onClick={addSticky}>
                  <StickyNote size={16} />
                </button>
                <button className="summary-add" type="button" onClick={addNote} disabled={!nodeId}>
                  <Plus size={16} strokeWidth={2.25} />
                  Página
                </button>
              </div>
            </div>
            <SilkScroll className="summary-toc-scroll">
              {loading ? <p className="text-[12px] text-ink-tertiary">Carregando…</p> : null}
              {!loading && notesForNode.length === 0 ? (
                <p className="text-[13px] leading-relaxed text-ink-tertiary">
                  Caderno vazio. Abra uma página nova e anote o que o curso ensinou.
                </p>
              ) : null}
              <ul className="space-y-1 pr-2">
                {notesForNode.map((note, index) => (
                  <li key={note.id}>
                    <button
                      className={`summary-leaf ${activeId === note.id ? 'is-active' : ''}`}
                      type="button"
                      onClick={() => runViewTransition(() => setActiveId(note.id), 'summary-leaf')}
                    >
                      <span className="summary-leaf-num">{String(index + 1).padStart(2, '0')}</span>
                      <span>
                        <span className="line-clamp-2 font-medium">{note.title}</span>
                        <span className="mt-1 block text-[11px] text-ink-tertiary">{relativeDate(note.updatedAt)}</span>
                      </span>
                      {note.reviewFlag ? <span className="note-leaf-flag" title="Revisar depois">!</span> : null}
                    </button>
                  </li>
                ))}
              </ul>
            </SilkScroll>
          </aside>
        </div>

        <section className="summary-spread">
          {error ? <p className="mb-3 px-2 text-[13px] text-danger">{error}</p> : null}
          {!active ? (
            <div className="notebook-empty">
              {!showPages ? (
                <div className="summary-reopen is-pages">
                  <DockButton open={false} onToggle={togglePages} label="páginas" variant="pages" />
                </div>
              ) : null}
              <p className="summary-kicker">Página em branco</p>
              <h2 className="summary-heading mt-2">Caderno de {selectedNode?.title || 'estudo'}</h2>
              <p className="mt-3 max-w-md text-[15px] leading-relaxed text-ink-secondary">
                Escreva na esquerda, leia na direita — como um caderno aberto. Resumo, código da aula e o que aquele trecho significa.
              </p>
            </div>
          ) : (
            <>
              <div className="notebook-toolbar">
                {!showPages ? (
                  <DockButton open={false} onToggle={togglePages} label="páginas" variant="pages" />
                ) : null}
                <div className="min-w-0 flex-1">
                  <input
                    className="summary-title"
                    value={title}
                    onChange={(event) => {
                      const next = event.target.value
                      setTitle(next)
                      queueSave({ title: next })
                    }}
                    placeholder="Título da anotação"
                  />
                  <TagBar
                    tags={tags}
                    requestAdd={addTagRequest}
                    onConsumeAdd={() => setAddTagRequest(false)}
                    onChange={(next) => {
                      setTags(next)
                      queueSave({ tags: next })
                    }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-ink-tertiary">{saving}</span>
                  <button className="note-icon-btn" type="button" title="Buscar" onClick={() => setFindOpen(true)}>
                    <Search size={16} />
                  </button>
                  <button className="note-icon-btn" type="button" title="Reformular com IA" onClick={openAssistant}>
                    <Sparkles size={16} />
                    <span className="note-ia-label">IA</span>
                  </button>
                  <button className="note-icon-btn" type="button" title="Exportar" onClick={() => setExportOpen(true)}>
                    <Download size={16} />
                  </button>
                  <button
                    className={`summary-view-btn ${previewOnly ? 'is-on' : ''}`}
                    type="button"
                    aria-pressed={previewOnly}
                    onClick={() => setPreviewOnly((value) => !value)}
                  >
                    {previewOnly ? 'Editar' : 'Só resultado'}
                  </button>
                  <button
                    className="summary-icon-btn"
                    type="button"
                    onClick={() => setConfirmRemove(true)}
                    aria-label="Remover anotação"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <FindReplace
                editor={editor}
                previewEditor={preview}
                open={findOpen}
                onClose={() => setFindOpen(false)}
              />
              <NotebookErrorBoundary>
                <div className={`notebook-stage ${previewOnly ? 'is-preview-only' : ''}`}>
                  <div className={`notebook-pages ${previewOnly ? 'is-preview-only' : ''}`}>
                    <SilkScroll
                      className={`notebook-col notebook-col-draft ${previewOnly ? 'is-parked' : ''}`}
                      paneClassName="notebook-sheet is-draft"
                    >
                        <NoteEditor
                          key={`${activeId}-${editorNonce}`}
                        initialContent={doc}
                        editable
                        onChange={handleDoc}
                        onReady={handleReady}
                        onWords={setWords}
                        onHistoryToast={flashStatus}
                        onSlashSticky={addSticky}
                      />
                    </SilkScroll>
                    <div className="notebook-col notebook-col-fair">
                      <SilkScroll paneClassName="notebook-sheet is-fair" paneRef={previewPaneRef}>
                        <NotePreview content={doc} exportRef={exportRef} onReady={handlePreviewReady} />
                      </SilkScroll>
                      <StickyRail
                        stickies={stickies}
                        paneRef={previewPaneRef}
                        onAdd={addSticky}
                        onChange={(sticky) => handleStickies(stickies.map((item) => (item.id === sticky.id ? sticky : item)))}
                        onRemove={(id) => handleStickies(stickies.filter((item) => item.id !== id))}
                      />
                    </div>
                  </div>
                </div>
              </NotebookErrorBoundary>
              <div className="note-meta-foot">
                <span>{words} palavras</span>
                <span>{readingLabel(words)}</span>
              </div>
            </>
          )}
        </section>
      </div>
      {confirmRemove ? (
        <div className="note-toast">
          <p>Remover esta anotação?</p>
          <button type="button" onClick={removeNote}>
            Remover
          </button>
          <button type="button" onClick={() => setConfirmRemove(false)}>
            Cancelar
          </button>
        </div>
      ) : null}
      <ExportSheet
        open={exportOpen}
        targetRef={exportRef}
        filename={fileName}
        doc={doc}
        onClose={() => setExportOpen(false)}
      />
      <NoteAssistantSheet
        open={assistantOpen}
        noteId={activeId}
        sourceMarkdown={assistantSnap?.sourceMarkdown || ''}
        selectionMarkdown={assistantSnap?.selectionMarkdown || ''}
        originalDoc={assistantSnap?.doc || doc}
        onDiscard={discardAssistant}
        onApprove={approveAssistant}
      />
    </div>
  )
}
