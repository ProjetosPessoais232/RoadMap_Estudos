import { Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { rewriteNote } from '../../../api'
import SilkScroll from '../SilkScroll.jsx'
import { markdownToNoteDoc } from './fromMarkdown.js'
import NotePreview from './NotePreview.jsx'

const SHORTCUTS = [
  { id: 'enxugar', label: 'Enxugar', instruction: 'Enxugue a nota: menos palavras, mesma ideia, sem perder o que importa para estudar.' },
  { id: 'checklist', label: 'Virar checklist', instruction: 'Transforme o conteúdo em uma checklist de estudo com tarefas concretas (- [ ]).' },
  { id: 'simples', label: 'Explicar mais simples', instruction: 'Reescreva em linguagem mais simples, como se eu estivesse revisando no dia seguinte da aula.' },
  { id: 'essencial', label: 'Extrair o essencial', instruction: 'Extraia só o essencial: o que preciso lembrar, o código-chave e o porquê.' },
]

export default function NoteAssistantSheet({
  open,
  noteId,
  sourceMarkdown,
  selectionMarkdown,
  originalDoc,
  onDiscard,
  onApprove,
}) {
  const [instruction, setInstruction] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [proposal, setProposal] = useState(null)

  const proposalDoc = useMemo(
    () => (proposal?.markdown ? markdownToNoteDoc(proposal.markdown) : null),
    [proposal],
  )

  if (!open) return null

  async function generate() {
    const text = instruction.trim()
    if (text.length < 2) {
      setError('Escreva o que a IA deve fazer com a nota (pelo menos 2 caracteres).')
      return
    }
    setBusy(true)
    setError('')
    try {
      const result = await rewriteNote({
        noteId,
        instruction: text,
        sourceMarkdown,
        selectionMarkdown: selectionMarkdown || undefined,
      })
      setProposal(result)
    } catch (err) {
      setProposal(null)
      setError(err.message || 'Não foi possível reformular a nota.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="note-export note-assistant" onClick={onDiscard}>
      <div className="note-assistant-sheet" onClick={(event) => event.stopPropagation()}>
        <div className="note-assistant-head">
          <p className="summary-kicker">Assistente</p>
          <h2 className="note-export-title">Reformular nota</h2>
          <p className="note-assistant-lead">
            A IA sugere um texto. Pode explicar conceitos se você pedir. Nada entra no caderno até você aprovar.
            {selectionMarkdown ? ' Há um trecho selecionado: a proposta vale só para ele.' : ''}
          </p>
        </div>

        <label className="note-assistant-field">
          <span>Instrução</span>
          <textarea
            value={instruction}
            onChange={(event) => setInstruction(event.target.value)}
            placeholder="Ex.: explique o que é getter e setter e encaixe nesse resumo"
            maxLength={2000}
            rows={3}
          />
        </label>

        <div className="note-assistant-shortcuts">
          {SHORTCUTS.map((item) => (
            <button
              key={item.id}
              className="note-chip"
              type="button"
              onClick={() => setInstruction(item.instruction)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="note-assistant-actions">
          <button className="note-assistant-generate" type="button" disabled={busy} onClick={generate}>
            <Sparkles size={16} />
            {busy ? 'Gerando…' : 'Gerar'}
          </button>
        </div>

        {error ? <p className="note-export-error">{error}</p> : null}
        {proposal?.aviso ? <p className="note-assistant-aviso">{proposal.aviso}</p> : null}

        <div className="note-assistant-split">
          <section className="note-assistant-pane">
            <p className="summary-kicker">Original</p>
            <SilkScroll paneClassName="notebook-sheet is-fair note-assistant-scroll">
              <NotePreview content={originalDoc} />
            </SilkScroll>
          </section>
          <section className="note-assistant-pane">
            <p className="summary-kicker">Proposta{proposal?.title ? ` · ${proposal.title}` : ''}</p>
            {proposalDoc ? (
              <SilkScroll paneClassName="notebook-sheet is-fair note-assistant-scroll">
                <NotePreview content={proposalDoc} />
              </SilkScroll>
            ) : (
              <p className="note-assistant-empty">Gere uma proposta para comparar aqui.</p>
            )}
          </section>
        </div>

        <div className="note-assistant-foot">
          <button className="note-export-cancel" type="button" onClick={onDiscard}>
            Descartar
          </button>
          <button
            className="note-assistant-approve"
            type="button"
            disabled={!proposalDoc || busy}
            onClick={() => onApprove(proposal)}
          >
            Aprovar
          </button>
        </div>
      </div>
    </div>
  )
}
