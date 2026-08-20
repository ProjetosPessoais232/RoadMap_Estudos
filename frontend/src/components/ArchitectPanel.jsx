import { useEffect, useState } from 'react'
import { listHistory } from '../api'
import StatusDot, { STATUS_LEGEND } from './StatusDot.jsx'

const labelClass = 'font-sans text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-tertiary'

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
    <aside className="flex h-full w-[340px] shrink-0 flex-col border-r border-hairline bg-surface px-5 py-6">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {STATUS_LEGEND.map((item) => (
          <p key={item.status} className="flex items-center gap-1.5 font-mono text-[11px] font-medium text-ink-tertiary">
            <StatusDot status={item.status} />
            {item.label}
          </p>
        ))}
      </div>

      <p className={`${labelClass} mt-6`}>Arquiteto</p>
      <p className="mt-2 text-[13px] leading-[1.65] text-ink-secondary">
        Descreva a ideia. A IA recomenda a stack e destaca nós do seu roadmap.
      </p>

      <form
        className="mt-6 flex flex-col"
        onSubmit={(event) => {
          event.preventDefault()
          const idea = new FormData(event.currentTarget).get('idea')
          onSubmit(String(idea || ''))
        }}
      >
        <textarea
          name="idea"
          required
          minLength={20}
          rows={5}
          className="w-full resize-none border border-hairline bg-void px-3 py-2 text-[14px] font-medium leading-[1.65] text-ink-primary outline-none placeholder:text-ink-tertiary"
          placeholder="Quero criar um app de entrega de comida com rastreamento em tempo real..."
        />
        <div className="mt-4 flex items-baseline gap-4">
          <button
            className="bg-ink-primary px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90 disabled:opacity-50"
            disabled={loading}
            type="submit"
          >
            {loading ? 'Arquitetando…' : 'Arquitetar'}
          </button>
          <button
            className="text-[13px] font-medium text-ink-secondary hover:text-ink-primary"
            type="button"
            onClick={onClear}
          >
            Limpar
          </button>
        </div>
        {loading && (
          <p className="mt-3 font-mono text-[11px] font-medium tracking-wide text-ink-tertiary">
            {status || 'Processando…'}
          </p>
        )}
      </form>

      <div className="mt-6 min-h-0 flex-1 space-y-8 overflow-y-auto">
        {result ? (
          <div className="space-y-5 border-t border-hairline pt-5">
            <blockquote className="border-l border-hairline pl-3 text-[14px] leading-[1.65] text-ink-secondary">
              {result.arquitetura_resumo}
            </blockquote>
            <div className="space-y-3">
              <QuoteField label="Frontend" value={result.stack_recomendada?.frontend} />
              <QuoteField label="Backend" value={result.stack_recomendada?.backend} />
              <QuoteField label="Database" value={result.stack_recomendada?.database} />
              <QuoteField
                label="Outros"
                value={(result.stack_recomendada?.outros || []).join(', ') || '—'}
              />
            </div>
            {result.nodes_para_ativar?.length > 0 && (
              <ul className="space-y-1">
                {result.nodes_para_ativar.map((id) => (
                  <li key={id}>
                    <button
                      type="button"
                      className="font-mono text-[12px] font-medium text-ink-secondary underline-offset-4 hover:text-accent hover:underline"
                      onClick={() => onHighlightNode(id)}
                    >
                      {id}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {result.nodes_para_ativar?.length === 0 && (
              <p className="empty-fade text-[12px] leading-[1.65] text-ink-secondary">
                Nenhum nó do seu roadmap correspondeu. Considere cadastrar as tecnologias da stack.
              </p>
            )}
          </div>
        ) : (
          !loading && (
            <p className="empty-fade border-t border-hairline pt-5 text-[13px] leading-[1.65] text-ink-secondary">
              Ainda não há uma arquitetura nesta sessão. Envie uma ideia com pelo menos 20 caracteres.
            </p>
          )
        )}

        <section className="border-t border-hairline pt-5">
          <h3 className={labelClass}>Histórico</h3>
          {history.length === 0 ? (
            <p className="empty-fade mt-2 text-[13px] leading-[1.65] text-ink-secondary">
              Nenhuma recomendação salva ainda.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {history.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="w-full text-left text-[13px] font-medium leading-[1.65] text-ink-secondary underline-offset-4 hover:text-accent hover:underline"
                    onClick={() => onPickHistory(item)}
                  >
                    <span className="line-clamp-2">{item.idea}</span>
                    <span className="mt-1 block font-mono text-[11px] font-medium text-ink-tertiary no-underline hover:no-underline">
                      {item.createdAt ? new Date(item.createdAt).toLocaleString('pt-BR') : ''}
                    </span>
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
    <div className="border-l border-hairline pl-3">
      <p className={labelClass}>{label}</p>
      <p className="mt-0.5 text-[14px] font-medium text-ink-primary">{value || '—'}</p>
    </div>
  )
}
