import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FolderInput, LogOut, MoreHorizontal, Plus } from 'lucide-react'
import {
  clearSession,
  createNode,
  getEmail,
  getHealth,
  getToken,
  importNodes,
  listNodes,
  recommendArchitecture,
  updateNode,
} from './api'
import { layoutOptionClusters, layoutWithDagre, needsAutoLayout, toFlowElements } from './layout'
import ArchitectPanel from './components/ArchitectPanel.jsx'
import ChatPage from './components/ChatPage.jsx'
import LoginPage from './components/LoginPage.jsx'
import NodePanel from './components/NodePanel.jsx'
import RoadmapCanvas from './components/RoadmapCanvas.jsx'

export default function App() {
  const [session, setSessionState] = useState(() =>
    getToken() ? { token: getToken(), email: getEmail() } : null,
  )
  const [health, setHealth] = useState('checando…')
  const [nodes, setNodes] = useState([])
  const [loadingNodes, setLoadingNodes] = useState(true)
  const [selectedId, setSelectedId] = useState(null)
  const [highlightedIds, setHighlightedIds] = useState([])
  const [architect, setArchitect] = useState(null)
  const [aiStatus, setAiStatus] = useState('')
  const [loadingAi, setLoadingAi] = useState(false)
  const [error, setError] = useState('')
  const [rootId, setRootId] = useState('')
  const [rootTitle, setRootTitle] = useState('')
  const [page, setPage] = useState('roadmap')

  const load = useCallback(async () => {
    setLoadingNodes(true)
    try {
      const [healthResponse, nodeList] = await Promise.all([getHealth(), listNodes()])
      setHealth(healthResponse.status)
      setNodes(needsAutoLayout(nodeList) ? layoutWithDagre(nodeList) : layoutOptionClusters(nodeList))
      setError('')
    } catch (err) {
      setHealth('offline')
      setError(err.message)
    } finally {
      setLoadingNodes(false)
    }
  }, [])

  useEffect(() => {
    if (session) {
      load()
    }
  }, [load, session])

  const selected = nodes.find((node) => node.id === selectedId) ?? null
  const { nodes: flowNodes, edges: flowEdges } = useMemo(
    () => toFlowElements(nodes, highlightedIds),
    [nodes, highlightedIds],
  )

  function upsertNode(updated, created = false) {
    setNodes((current) => {
      if (created) {
        return [...current, updated]
      }
      return current.map((node) => (node.id === updated.id ? updated : node))
    })
  }

  async function handleMove(id, position) {
    const node = nodes.find((item) => item.id === id)
    if (!node) return
    try {
      upsertNode(
        await updateNode(id, {
          title: node.title,
          description: node.description,
          parentId: node.parentId,
          posX: position.x,
          posY: position.y,
        }),
      )
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleArchitect(idea) {
    setLoadingAi(true)
    setAiStatus('Consultando Gemini Flash…')
    try {
      const result = await recommendArchitecture(idea)
      setArchitect(result)
      setHighlightedIds(result.nodes_para_ativar || [])
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingAi(false)
      setAiStatus('')
    }
  }

  async function addRoot(event) {
    event.preventDefault()
    const maxY = nodes.reduce((acc, node) => Math.max(acc, node.posY ?? 0), 0)
    try {
      const created = await createNode({
        id: rootId.trim().toLowerCase(),
        title: rootTitle.trim(),
        posX: 0,
        posY: maxY + 140,
      })
      setRootId('')
      setRootTitle('')
      upsertNode(created, true)
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleImport() {
    try {
      const payload = await fetch('/roadmap-import.json').then((res) => res.json())
      const result = await importNodes(payload.nodes)
      await load()
      setError('')
      setAiStatus('')
      window.alert(`Importação: ${result.created} criados, ${result.skipped} ignorados.`)
    } catch (err) {
      setError(err.message)
    }
  }

  if (!session) {
    return <LoginPage onAuthenticated={setSessionState} />
  }

  return (
    <div className="flex h-screen flex-col bg-void text-ink-primary">
      <ShellHeader
        page={page}
        setPage={setPage}
        session={session}
        health={health}
        rootId={rootId}
        rootTitle={rootTitle}
        setRootId={setRootId}
        setRootTitle={setRootTitle}
        onAddRoot={addRoot}
        onImport={handleImport}
        onLogout={() => {
          clearSession()
          setSessionState(null)
        }}
      />

      {page === 'roadmap' && error && (
        <p className="border-b border-danger/35 px-5 py-2 text-[13px] text-danger">{error}</p>
      )}

      <main key={page} className="page-view flex min-h-0 flex-1 flex-col">
      {page === 'chat' ? (
        <ChatPage />
      ) : (
      <div className="flex min-h-0 flex-1">
        <ArchitectPanel
          loading={loadingAi}
          status={aiStatus}
          result={architect}
          onSubmit={handleArchitect}
          onPickHistory={(item) => {
            setArchitect(item)
            setHighlightedIds(item.nodes_para_ativar || [])
          }}
          onClear={() => {
            setArchitect(null)
            setHighlightedIds([])
          }}
          onHighlightNode={(id) => setHighlightedIds([id])}
        />
        <div className="relative min-w-0 flex-1">
          {loadingNodes && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface/85 text-[13px] font-medium text-ink-secondary backdrop-blur-sm">
              Carregando roadmap…
            </div>
          )}
          {!loadingNodes && nodes.length === 0 && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 px-6 text-center">
              <p className="empty-fade font-display text-[22px] font-semibold text-ink-primary">Nenhum nó cadastrado.</p>
              <p className="empty-fade empty-fade-2 text-[13px] text-ink-secondary">
                Use “Nova raiz” ou “Importar amostra” no menu ⋯
              </p>
            </div>
          )}
          <RoadmapCanvas
            flowNodes={flowNodes}
            flowEdges={flowEdges}
            onSelect={setSelectedId}
            onMove={handleMove}
          />
        </div>
        {selected ? (
          <NodePanel
            node={selected}
            childrenNodes={nodes.filter((item) => item.parentId === selected.id)}
            onChanged={upsertNode}
            onDeleted={(id) => {
              setNodes((current) => current.filter((node) => node.id !== id))
              setSelectedId(null)
            }}
            onError={setError}
          />
        ) : (
          <aside className="hidden w-[280px] shrink-0 border-l border-hairline bg-surface px-5 py-8 text-[14px] leading-[1.65] text-ink-secondary lg:block">
            <p className="empty-fade font-sans text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-tertiary">Nó</p>
            <p className="empty-fade empty-fade-2 mt-3">Clique em um nó para editar status, cursos e filhos.</p>
          </aside>
        )}
      </div>
      )}
      </main>
    </div>
  )
}

function ShellHeader({
  page,
  setPage,
  session,
  health,
  rootId,
  rootTitle,
  setRootId,
  setRootTitle,
  onAddRoot,
  onImport,
  onLogout,
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    function close(event) {
      if (!menuRef.current?.contains(event.target)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) {
      document.addEventListener('pointerdown', close)
    }
    return () => document.removeEventListener('pointerdown', close)
  }, [menuOpen])

  return (
    <header className="relative z-20 flex h-12 shrink-0 items-center justify-between border-b border-hairline bg-surface px-5">
      <div className="flex min-w-0 items-center gap-8">
        <h1 className="font-display text-[17px] font-semibold tracking-tight text-ink-primary">
          LMS de Estudos
        </h1>
        <nav className="flex items-center gap-6">
          <button
            className={`border-b pb-px text-[13px] font-semibold tracking-wide ${
              page === 'roadmap'
                ? 'border-accent text-ink-primary'
                : 'border-transparent text-ink-secondary hover:text-ink-primary'
            }`}
            type="button"
            onClick={() => setPage('roadmap')}
          >
            Roadmap
          </button>
          <button
            className={`border-b pb-px text-[13px] font-semibold tracking-wide ${
              page === 'chat'
                ? 'border-accent text-ink-primary'
                : 'border-transparent text-ink-secondary hover:text-ink-primary'
            }`}
            type="button"
            onClick={() => setPage('chat')}
          >
            Chat de cursos
          </button>
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <p className="hidden max-w-[180px] truncate font-mono text-[11px] font-medium tracking-wide text-ink-tertiary md:block">
          {session.email}
        </p>
        <div className="relative" ref={menuRef}>
          <button
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label="Abrir menu"
            className="flex h-8 w-8 items-center justify-center text-ink-secondary hover:text-ink-primary"
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <MoreHorizontal size={16} strokeWidth={1.5} />
          </button>
          {menuOpen && (
            <div
              className="shadow-soft absolute right-0 top-[calc(100%+8px)] w-64 border border-hairline bg-surface/85 p-3 backdrop-blur-md"
              role="menu"
            >
              <p className="truncate font-mono text-[11px] font-medium tracking-wide text-ink-secondary">{session.email}</p>
              <p className="mt-1 font-mono text-[11px] font-medium tracking-wide text-ink-tertiary">
                API {health}
              </p>

              {page === 'roadmap' && (
                <form
                  className="mt-3 space-y-2 border-t border-hairline pt-3"
                  onSubmit={(event) => {
                    onAddRoot(event)
                    setMenuOpen(false)
                  }}
                >
                  <p className="flex items-center gap-1.5 font-sans text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-tertiary">
                    <Plus size={12} strokeWidth={1.5} />
                    Nova raiz
                  </p>
                  <input
                    className="w-full border border-hairline bg-void px-2 py-1.5 text-[13px] font-medium text-ink-primary outline-none placeholder:text-ink-tertiary"
                    placeholder="id"
                    value={rootId}
                    onChange={(event) => setRootId(event.target.value)}
                    required
                  />
                  <input
                    className="w-full border border-hairline bg-void px-2 py-1.5 text-[13px] font-medium text-ink-primary outline-none placeholder:text-ink-tertiary"
                    placeholder="título"
                    value={rootTitle}
                    onChange={(event) => setRootTitle(event.target.value)}
                    required
                  />
                  <button
                    className="text-[13px] font-semibold text-ink-secondary underline-offset-4 hover:text-accent hover:underline"
                    type="submit"
                  >
                    Criar
                  </button>
                </form>
              )}

              <div className="mt-3 space-y-1 border-t border-hairline pt-3">
                {page === 'roadmap' && (
                  <button
                    className="flex w-full items-center gap-2 py-1 text-left text-[13px] font-medium text-ink-secondary hover:text-ink-primary"
                    type="button"
                    onClick={() => {
                      onImport()
                      setMenuOpen(false)
                    }}
                  >
                    <FolderInput size={14} strokeWidth={1.5} />
                    Importar amostra
                  </button>
                )}
                <button
                  className="flex w-full items-center gap-2 py-1 text-left text-[13px] font-medium text-ink-secondary hover:text-ink-primary"
                  type="button"
                  onClick={onLogout}
                >
                  <LogOut size={14} strokeWidth={1.5} />
                  Sair
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
