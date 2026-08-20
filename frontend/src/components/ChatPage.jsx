import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { chatCourses, createCourse, listNodes } from '../api'

const SUGGESTIONS = [
  'Quero um curso de Java na Udemy para começar do zero.',
  'Me indique um curso grátis de React no YouTube.',
  'Quais cursos de PostgreSQL combinam com o meu roadmap?',
  'Estou em dúvida entre Alura e Coursera para Spring Boot.',
]

const WELCOME =
  'Me conte o que você quer estudar: nome do curso, plataforma ou um link. Eu discuto as opções e, quando fizer sentido, relaciono com um nó do seu roadmap para você salvar.'

export default function ChatPage() {
  const [nodes, setNodes] = useState([])
  const [messages, setMessages] = useState([{ role: 'assistant', content: WELCOME, courses: [] }])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [picks, setPicks] = useState({})
  const [saved, setSaved] = useState({})
  const bottomRef = useRef(null)

  useEffect(() => {
    listNodes()
      .then(setNodes)
      .catch((err) => setError(err.message))
  }, [])

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    bottomRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' })
  }, [messages, loading])

  const nodeLabel = useMemo(() => {
    const map = {}
    for (const node of nodes) {
      map[node.id] = node.title
    }
    return map
  }, [nodes])

  async function send(text) {
    const message = text.trim()
    if (message.length < 2 || loading) return

    const history = messages
      .filter((item) => item.content !== WELCOME)
      .filter((item) => item.role === 'user' || item.role === 'assistant')
      .map((item) => ({ role: item.role, content: item.content }))

    setDraft('')
    setError('')
    setMessages((current) => [...current, { role: 'user', content: message, courses: [] }])
    setLoading(true)
    try {
      const result = await chatCourses(message, history)
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: result.resposta,
          courses: result.cursos_sugeridos || [],
        },
      ])
    } catch (err) {
      setError(err.message)
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: err.message || 'Não consegui responder agora. Tente de novo em instantes.',
          courses: [],
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  async function saveCourse(course, key) {
    const nodeId = course.node_id || picks[key]
    if (!nodeId) {
      setError('Escolha um nó do roadmap antes de salvar este curso.')
      return
    }
    try {
      await createCourse({
        name: course.nome,
        platform: course.plataforma,
        url: course.url,
        nodeId,
      })
      setSaved((current) => ({ ...current, [key]: nodeId }))
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-2xl flex-col bg-void px-5 py-8">
      <header className="mb-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-tertiary">Mentor de cursos</p>
        <h2 className="mt-2 font-display text-[28px] font-normal tracking-tight text-ink-primary">Chat com a IA</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-secondary">
          Discuta nomes, plataformas e links. Os cards sugeridos podem ser salvos em um nó do roadmap.
        </p>
      </header>

      {error && <p className="mb-8 border border-danger/40 px-3 py-2 text-[13px] text-danger">{error}</p>}

      <div className="min-h-0 flex-1 space-y-10 overflow-y-auto">
        {messages.map((item, index) => (
          <article key={`${item.role}-${index}`} className={item.role === 'user' ? 'ml-12 text-right' : 'mr-12'}>
            {item.role === 'assistant' && (
              <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-tertiary">IA</p>
            )}
            <p
              className={`whitespace-pre-wrap text-[15px] leading-[1.7] ${
                item.role === 'user' ? 'text-ink-primary' : 'text-ink-secondary'
              }`}
            >
              {item.content}
            </p>
            {item.courses?.length > 0 && (
              <ul className="mt-6 space-y-5 text-left">
                {item.courses.map((course, courseIndex) => {
                  const key = `${index}-${courseIndex}-${course.url}`
                  const boundNode = course.node_id || picks[key]
                  return (
                    <li key={key} className="border-l border-hairline pl-3">
                      <p className="text-[15px] text-ink-primary">{course.nome}</p>
                      <p className="font-mono text-[11px] tracking-wide text-ink-tertiary">{course.plataforma}</p>
                      <a
                        className="mt-1 block truncate text-[12px] text-ink-secondary underline-offset-4 hover:text-copper hover:underline"
                        href={course.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {course.url}
                      </a>
                      {course.node_id ? (
                        <p className="mt-2 font-mono text-[11px] text-ink-tertiary">
                          {nodeLabel[course.node_id] || course.node_id}
                        </p>
                      ) : (
                        <select
                          className="mt-2 w-full border-0 border-b border-hairline bg-transparent py-1 font-mono text-[12px] text-ink-secondary outline-none focus:border-copper"
                          value={picks[key] || ''}
                          onChange={(event) =>
                            setPicks((current) => ({ ...current, [key]: event.target.value }))
                          }
                        >
                          <option value="">Escolher nó do roadmap</option>
                          {nodes.map((node) => (
                            <option key={node.id} value={node.id}>
                              {node.title}
                            </option>
                          ))}
                        </select>
                      )}
                      <button
                        className="mt-2 text-[13px] text-ink-secondary underline-offset-4 hover:text-copper hover:underline disabled:text-ink-tertiary disabled:no-underline"
                        disabled={Boolean(saved[key]) || !boundNode}
                        type="button"
                        onClick={() => saveCourse(course, key)}
                      >
                        {saved[key] ? 'Salvo no nó' : 'Salvar no nó'}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </article>
        ))}
        {loading && (
          <p className="font-mono text-[11px] tracking-wide text-ink-tertiary">A IA está pensando…</p>
        )}
        <div ref={bottomRef} />
      </div>

      {messages.length === 1 && (
        <div className="mt-8 flex flex-col items-start gap-3">
          {SUGGESTIONS.map((item, index) => (
            <button
              key={item}
              className={`empty-fade text-left text-[13px] text-ink-secondary underline-offset-4 hover:text-copper hover:underline ${
                index === 1 ? 'empty-fade-2' : index === 2 ? 'empty-fade-3' : index === 3 ? 'empty-fade-4' : ''
              }`}
              type="button"
              onClick={() => send(item)}
            >
              {item}
            </button>
          ))}
        </div>
      )}

      <form
        className="mt-6 flex items-end gap-3 border-t border-hairline pt-4"
        onSubmit={(event) => {
          event.preventDefault()
          send(draft)
        }}
      >
        <input
          className="min-w-0 flex-1 border-0 bg-transparent py-2 text-[15px] text-ink-primary placeholder:text-ink-tertiary"
          placeholder="Ex.: quero o curso Java COMPLETO da Udemy…"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          minLength={2}
          required
        />
        <button
          aria-label="Enviar"
          className="mb-1 text-copper transition-opacity duration-150 hover:opacity-80 disabled:text-ink-tertiary"
          disabled={loading}
          type="submit"
        >
          <ArrowUp size={18} strokeWidth={1.5} />
        </button>
      </form>
    </div>
  )
}
