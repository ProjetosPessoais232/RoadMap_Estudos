import { useEffect, useState } from 'react'
import { PanelLeft, Sparkles } from 'lucide-react'
import { listHistory } from '../api'
import StatusDot, { STATUS_LEGEND } from './StatusDot.jsx'

export function SidebarToggle({ open, onToggle }) {
  return (
    <button
      aria-label={open ? 'Ocultar menu esquerdo' : 'Mostrar menu esquerdo'}
      aria-pressed={open}
      className={`sidebar-toggle ${open ? 'is-open' : ''}`}
      type="button"
      onClick={onToggle}
    >
      <PanelLeft size={18} strokeWidth={1.75} />
    </button>
  )
}

export default function ArchitectPanel({
  loading,
  status,
  result,
  onSubmit,
  onClear,
  onPickHistory,
  onHighlightNode,
}) {
  const [history, setHistory] = useState([])

  useEffect(() => {
    listHistory()
      .then(setHistory)
      .catch(() => setHistory([]))
  }, [result])

  return (
    <aside className="architect-panel flex h-full w-[360px] flex-col">
      <header className="architect-panel-head">
        <div className="h-9 w-9 shrink-0" aria-hidden="true" />
        <div>
          <p className="architect-kicker">Studio</p>
          <h2 className="architect-title">Arquiteto</h2>
        </div>
      </header>

      <div className="architect-legend" role="list">
        {STATUS_LEGEND.map((item) => (
          <p key={item.status} className="architect-legend-item" role="listitem">
            <StatusDot status={item.status} />
            <span>{item.label}</span>
          </p>
        ))}
      </div>

      <form
        className="architect-composer"
        onSubmit={(event) => {
          event.preventDefault()
          const idea = new FormData(event.currentTarget).get('idea')
          onSubmit(String(idea || ''))
        }}
      >
        <label className="architect-kicker" htmlFor="architect-idea">
          Nova ideia
        </label>
        <p className="architect-lede">A IA recomenda a stack e destaca os nós do seu mapa.</p>
        <textarea
          id="architect-idea"
          name="idea"
          required
          minLength={20}
          rows={5}
          className="architect-input"
          placeholder="Quero criar um app de entrega de comida com rastreamento em tempo real…"
        />
        <div className="architect-actions">
          <button className="architect-submit" disabled={loading} type="submit">
            <Sparkles size={14} strokeWidth={2} />
            {loading ? 'Arquitetando…' : 'Arquitetar'}
          </button>
          <button className="architect-ghost" type="button" onClick={onClear}>
            Limpar
          </button>
        </div>
        {loading ? <p className="architect-status">{status || 'Processando…'}</p> : null}
      </form>

      <div className="architect-scroll">
        {result ? (
          <section className="architect-result">
            <p className="architect-kicker">Recomendação</p>
            <blockquote className="architect-quote">{result.arquitetura_resumo}</blockquote>
            <div className="architect-stack">
              <QuoteField label="Frontend" value={result.stack_recomendada?.frontend} />
              <QuoteField label="Backend" value={result.stack_recomendada?.backend} />
              <QuoteField label="Database" value={result.stack_recomendada?.database} />
              <QuoteField label="Outros" value={(result.stack_recomendada?.outros || []).join(', ') || '—'} />
            </div>
            {result.nodes_para_ativar?.length > 0 ? (
              <div className="architect-nodes">
                {result.nodes_para_ativar.map((id) => (
                  <button key={id} type="button" className="architect-chip" onClick={() => onHighlightNode(id)}>
                    {id}
                  </button>
                ))}
              </div>
            ) : (
              <p className="architect-empty">
                Nenhum nó do roadmap correspondeu. Cadastre as tecnologias da stack.
              </p>
            )}
          </section>
        ) : (
          !loading && (
            <p className="architect-empty architect-empty-block">
              Ainda não há uma arquitetura nesta sessão. Envie uma ideia com pelo menos 20 caracteres.
            </p>
          )
        )}

        <section className="architect-history">
          <div className="architect-history-head">
            <h3 className="architect-kicker">Histórico</h3>
            <span className="architect-count">{history.length}</span>
          </div>
          {history.length === 0 ? (
            <p className="architect-empty">Nenhuma recomendação salva ainda.</p>
          ) : (
            <ul className="architect-history-list">
              {history.map((item) => (
                <li key={item.id}>
                  <button type="button" className="architect-history-item" onClick={() => onPickHistory(item)}>
                    <span className="line-clamp-2">{item.idea}</span>
                    <time>
                      {item.createdAt ? new Date(item.createdAt).toLocaleString('pt-BR') : ''}
                    </time>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </aside>
  )
}

function QuoteField({ label, value }) {
  return (
    <div className="architect-field">
      <p className="architect-kicker">{label}</p>
      <p>{value || '—'}</p>
    </div>
  )
}
