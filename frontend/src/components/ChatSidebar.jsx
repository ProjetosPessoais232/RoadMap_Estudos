import { MoreHorizontal, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useState } from 'react'

function relativeDate(value) {
  const date = new Date(value)
  const minutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60_000))
  if (minutes < 1) return 'agora'
  if (minutes < 60) return `${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} h`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days} d`
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export default function ChatSidebar({ conversations, activeId, loading, query, onQueryChange, onSelect, onNew, onRename, onDelete }) {
  const [menuId, setMenuId] = useState(null)
  const [editing, setEditing] = useState(null)
  const [title, setTitle] = useState('')

  function startRename(conversation) {
    setEditing(conversation.id)
    setTitle(conversation.title)
    setMenuId(null)
  }

  function submitRename(event) {
    event.preventDefault()
    if (!title.trim()) return
    onRename(editing, title.trim())
    setEditing(null)
  }

  return (
    <aside className="sidebar-enter flex h-full w-[260px] shrink-0 flex-col border-r-2 border-node-border bg-white p-3">
      <button className="btn-ink flex items-center justify-center gap-2 rounded-lg bg-black px-3 py-2.5 text-[13px] font-semibold text-white hover:opacity-90" type="button" onClick={onNew}>
        <Plus size={16} strokeWidth={2.25} /> Nova conversa
      </button>
      <label className="relative mt-4 block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-tertiary" size={15} />
        <input className="w-full rounded-lg border-2 border-node-border py-2 pl-9 pr-3 text-[13px] text-ink-primary outline-none placeholder:text-ink-tertiary" placeholder="Buscar conversas" value={query} onChange={(event) => onQueryChange(event.target.value)} />
      </label>
      <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
        {loading ? <p className="px-2 text-[12px] text-ink-tertiary">Carregando...</p> : null}
        {!loading && conversations.length === 0 ? <p className="px-2 text-[12px] leading-relaxed text-ink-tertiary">Nenhuma conversa encontrada.</p> : null}
        <ul className="list-stagger space-y-1">
          {conversations.map((conversation) => (
            <li key={conversation.id} className="relative">
              {editing === conversation.id ? (
                <form className="p-1" onSubmit={submitRename}>
                  <input autoFocus className="w-full rounded-md border-2 border-node-border px-2 py-1.5 text-[13px] outline-none" value={title} onChange={(event) => setTitle(event.target.value)} onBlur={() => setEditing(null)} />
                </form>
              ) : (
                <div className={`group flex items-center rounded-lg transition-colors duration-300 ${activeId === conversation.id ? 'bg-node-main' : 'hover:bg-node-option'}`}>
                  <button className="min-w-0 flex-1 px-3 py-2 text-left" type="button" onClick={() => onSelect(conversation.id)}>
                    <p className="truncate text-[13px] font-semibold text-ink-primary">{conversation.title}</p>
                    <p className="mt-0.5 text-[11px] text-ink-tertiary">{relativeDate(conversation.updatedAt)}</p>
                  </button>
                  <button aria-label={`Menu da conversa ${conversation.title}`} className="mr-1 hidden h-7 w-7 items-center justify-center rounded-md hover:bg-white group-hover:flex" type="button" onClick={() => setMenuId(menuId === conversation.id ? null : conversation.id)}>
                    <MoreHorizontal size={16} />
                  </button>
                  {menuId === conversation.id ? (
                    <div className="menu-enter absolute right-1 top-9 z-10 w-32 rounded-lg border-2 border-node-border bg-white p-1 shadow-soft">
                      <button className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[12px] hover:bg-node-option" type="button" onClick={() => startRename(conversation)}><Pencil size={13} /> Renomear</button>
                      <button className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[12px] text-danger hover:bg-red-50" type="button" onClick={() => { setMenuId(null); onDelete(conversation.id) }}><Trash2 size={13} /> Apagar</button>
                    </div>
                  ) : null}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
