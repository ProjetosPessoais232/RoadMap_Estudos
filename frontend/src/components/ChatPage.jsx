import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import {
  chatCourses,
  createCourse,
  deleteConversation,
  getConversation,
  listConversations,
  listNodes,
  renameConversation,
  searchConversations,
} from '../api'
import ChatSidebar from './ChatSidebar.jsx'
import ChatMessage, { TypingMessage } from './chat/ChatMessage.jsx'
import CourseCard from './chat/CourseCard.jsx'
import Toast from './chat/Toast.jsx'

const WELCOME = 'Me conte o que você quer estudar: nome do curso, plataforma ou um link. Eu discuto as opções e, quando fizer sentido, relaciono com um nó do seu roadmap para você salvar.'
const PLACEHOLDERS = [
  'Ex.: curso de Java na Udemy do zero...',
  'Ex.: React grátis no YouTube...',
  'Ex.: PostgreSQL para o meu roadmap...',
]

export default function ChatPage() {
  const [nodes, setNodes] = useState([])
  const [conversations, setConversations] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [messages, setMessages] = useState([])
  const [loadingConversations, setLoadingConversations] = useState(true)
  const [loadingConversation, setLoadingConversation] = useState(false)
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [picks, setPicks] = useState({})
  const [saved, setSaved] = useState({})
  const [toast, setToast] = useState('')
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const bottomRef = useRef(null)
  const toastTimer = useRef(null)

  useEffect(() => {
    listNodes().then(setNodes).catch((err) => setError(err.message))
    listConversations()
      .then(async (items) => {
        setConversations(items)
        if (items[0]) await selectConversation(items[0].id)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoadingConversations(false))
    return () => window.clearTimeout(toastTimer.current)
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => setPlaceholderIndex((index) => (index + 1) % PLACEHOLDERS.length), 5000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    bottomRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' })
  }, [messages, loading, activeId])

  const nodeLabel = useMemo(() => Object.fromEntries(nodes.map((node) => [node.id, node.title])), [nodes])
  const activeConversation = conversations.find((conversation) => conversation.id === activeId)
  const title = activeConversation?.title || 'Nova conversa'

  async function refreshConversations(selectId) {
    const items = await listConversations()
    setConversations(items)
    if (selectId) setActiveId(selectId)
    return items
  }

  async function selectConversation(id) {
    setLoadingConversation(true)
    setError('')
    try {
      const conversation = await getConversation(id)
      setActiveId(conversation.id)
      setMessages((conversation.messages || []).map((message) => ({
        role: message.role,
        content: message.content,
        courses: message.cursosSugeridos || [],
      })))
      setPicks({})
      setSaved({})
    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingConversation(false)
    }
  }

  function newConversation() {
    setActiveId(null)
    setMessages([])
    setDraft('')
    setPicks({})
    setSaved({})
    setError('')
  }

  async function handleSearch(value) {
    setQuery(value)
    try {
      setLoadingConversations(true)
      setConversations(value.trim() ? await searchConversations(value.trim()) : await listConversations())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingConversations(false)
    }
  }

  async function handleRename(id, nextTitle) {
    try {
      const updated = await renameConversation(id, nextTitle)
      setConversations((current) => current.map((item) => (item.id === id ? updated : item)))
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete(id) {
    try {
      await deleteConversation(id)
      const wasActive = id === activeId
      const items = await refreshConversations(wasActive ? null : activeId)
      if (wasActive) {
        if (items[0]) await selectConversation(items[0].id)
        else newConversation()
      }
    } catch (err) {
      setError(err.message)
    }
  }

  async function send(text) {
    const message = text.trim()
    if (message.length < 2 || loading) return
    const history = messages.map((item) => ({ role: item.role, content: item.content }))
    setDraft('')
    setError('')
    setMessages((current) => [...current, { role: 'user', content: message, courses: [] }])
    setLoading(true)
    try {
      const result = await chatCourses(message, history, activeId)
      setMessages((current) => [...current, { role: 'assistant', content: result.resposta, courses: result.cursos_sugeridos || [] }])
      if (result.conversationId) {
        setActiveId(result.conversationId)
        await refreshConversations(result.conversationId)
      }
    } catch (err) {
      setError(err.message)
      setMessages((current) => [...current, { role: 'assistant', content: err.message || 'Não consegui responder agora. Tente de novo em instantes.', courses: [] }])
    } finally {
      setLoading(false)
    }
  }

  function showToast(message) {
    setToast(message)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(''), 3000)
  }

  async function saveCourse(course, key, nodeId) {
    if (!nodeId) return
    try {
      await createCourse({ name: course.nome, platform: course.plataforma, url: course.url, nodeId })
      setSaved((current) => ({ ...current, [key]: true }))
      setError('')
      showToast('Adicionado ao roadmap ✓')
    } catch (err) {
      setError(err.message)
    }
  }

  const renderedMessages = messages.length ? messages : [{ role: 'assistant', content: WELCOME, courses: [] }]

  return (
    <div className="flex h-full min-h-0 w-full flex-1 bg-white">
      <ChatSidebar conversations={conversations} activeId={activeId} loading={loadingConversations} query={query} onQueryChange={handleSearch} onSelect={selectConversation} onNew={newConversation} onRename={handleRename} onDelete={handleDelete} />
      <section className="relative mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col px-5">
        <header className="empty-fade shrink-0 py-5">
          <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-tertiary">Mentor de cursos</p>
          <h2 className="mt-1 font-display text-[22px] font-semibold tracking-tight text-ink-primary">{title}</h2>
        </header>
        {error ? <p className="error-enter mb-3 shrink-0 rounded-lg border-2 border-danger bg-white px-3 py-2 text-[13px] text-danger">{error}</p> : null}
        <div className="min-h-0 flex-1 overflow-y-auto pb-4">
          <div key={activeId || 'new'} className="chat-conversation-enter flex min-h-full flex-col justify-end gap-5">
            {loadingConversation ? <p className="text-[13px] text-ink-tertiary">Carregando conversa...</p> : null}
            {!loadingConversation && renderedMessages.map((item, index) => {
              const children = item.role === 'assistant' && item.courses?.length > 0 ? item.courses.slice(0, 4).map((course, courseIndex) => {
                const key = `${index}-${courseIndex}-${course.url}`
                return <CourseCard key={key} course={course} nodes={nodes} nodeLabel={nodeLabel} selectedNodeId={picks[key]} onSelectNode={(nodeId) => setPicks((current) => ({ ...current, [key]: nodeId }))} onSave={(nodeId) => saveCourse(course, key, nodeId)} saved={Boolean(saved[key])} />
              }) : null
              return <ChatMessage key={`${item.role}-${index}`} role={item.role} content={item.content}>{children}</ChatMessage>
            })}
            {loading ? <TypingMessage /> : null}
            <div ref={bottomRef} />
          </div>
        </div>
        <form className="sticky bottom-0 mt-auto flex shrink-0 items-center gap-2 rounded-xl border-2 border-node-border bg-white p-2 transition-shadow duration-300 focus-within:shadow-soft" onSubmit={(event) => { event.preventDefault(); send(draft) }}>
          <input className="min-w-0 flex-1 rounded-lg border-0 bg-transparent px-2 py-1.5 text-[15px] font-medium text-ink-primary placeholder:text-ink-tertiary" placeholder={PLACEHOLDERS[placeholderIndex]} value={draft} onChange={(event) => setDraft(event.target.value)} minLength={2} required />
          <button aria-label="Enviar" className="btn-ink flex h-9 w-9 items-center justify-center rounded-lg bg-black text-white hover:opacity-80 disabled:bg-ink-tertiary" disabled={loading} type="submit"><ArrowUp size={18} strokeWidth={1.75} /></button>
        </form>
        <Toast message={toast} />
      </section>
    </div>
  )
}
