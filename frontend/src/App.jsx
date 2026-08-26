import { Component, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { FolderInput, LogOut, MoreHorizontal } from 'lucide-react'
import {
  clearSession,
  createNode,
  deleteNode,
  getEmail,
  getHealth,
  getToken,
  importNodes,
  listNodes,
  patchNodeStyle,
  recommendArchitecture,
  updateNode,
} from './api'
import { applyLoadedLayout, toFlowElements } from './layout'
import { DEFAULT_TITLE, defaultStyle } from './nodeStyle.js'
import ArchitectPanel, { SidebarToggle } from './components/ArchitectPanel.jsx'
import ChatPage from './components/ChatPage.jsx'
import SummaryPage from './components/summary/SummaryPage.jsx'
import LoginPage from './components/LoginPage.jsx'
import LandingPage from './landing/LandingPage.jsx'
import NodePanel from './components/NodePanel.jsx'
import RoadmapCanvas from './components/RoadmapCanvas.jsx'
import AppLogo from './components/AppLogo.jsx'
import { runViewTransition } from './motion.js'

class PageErrorBoundary extends Component {
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
        <div className="flex min-h-0 flex-1 items-center justify-center p-8">
          <p className="max-w-md text-center text-[15px] leading-relaxed text-ink-secondary">
            Esta página quebrou ao renderizar. Volte ao Roadmap e abra o Summary de novo.
          </p>
        </div>
      )
    }
    return this.props.children
  }
}

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
  const [page, setPage] = useState('roadmap')
  const [publicView, setPublicView] = useState('landing')
  const [authMode, setAuthMode] = useState('login')
  const [creationMode, setCreationMode] = useState(null)
  const [justCreatedId, setJustCreatedId] = useState(null)
  const [titleEditing, setTitleEditing] = useState(false)
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(() => localStorage.getItem('paperless_left_sidebar') !== '0')
  const [panelNode, setPanelNode] = useState(null)
  const nodesRef = useRef([])
  const lastShapeRef = useRef('rounded')
  const handlersRef = useRef({})

  const load = useCallback(async () => {
    setLoadingNodes(true)
    try {
      const [healthResponse, nodeList] = await Promise.all([getHealth(), listNodes()])
      setHealth(healthResponse.status)
      setNodes(applyLoadedLayout(nodeList))
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
  nodesRef.current = nodes

  useEffect(() => {
    if (selected) {
      setPanelNode(selected)
    }
  }, [selected])

  const { nodes: rawFlowNodes, edges: flowEdges } = useMemo(
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

  async function persistFields(id, patch) {
    const node = nodesRef.current.find((item) => item.id === id)
    if (!node) return
    const previous = node
    const payload = {
      title: patch.title ?? node.title,
      description: patch.description ?? node.description,
      parentId: patch.parentId === undefined ? node.parentId : patch.parentId,
      posX: patch.posX ?? node.posX,
      posY: patch.posY ?? node.posY,
    }
    upsertNode({ ...node, ...patch })
    try {
      upsertNode(await updateNode(id, payload))
    } catch (err) {
      upsertNode(previous)
      setError(err.message)
    }
  }

  async function handleMove(id, position) {
    await persistFields(id, { posX: position.x, posY: position.y })
  }

  async function handleTitleChange(id, title) {
    await persistFields(id, { title })
  }

  async function handleStyleChange(id, partial) {
    const node = nodesRef.current.find((item) => item.id === id)
    if (!node) return
    const previous = node
    const style = {
      ...defaultStyle(node.style?.shape || 'rounded', !node.parentId),
      ...node.style,
      ...partial,
    }
    upsertNode({ ...node, style })
    try {
      upsertNode(await patchNodeStyle(id, style))
    } catch (err) {
      upsertNode(previous)
      setError(err.message)
    }
  }

  async function handleCreate({ position, shape, parentId }) {
    const chosen = shape || lastShapeRef.current || 'rounded'
    try {
      const created = await createNode({
        title: DEFAULT_TITLE,
        parentId: parentId || null,
        posX: position.x,
        posY: position.y,
        style: defaultStyle(chosen, !parentId),
      })
      upsertNode(created, true)
      setSelectedId(created.id)
      setCreationMode(null)
      setJustCreatedId(created.id)
      window.setTimeout(() => setJustCreatedId((current) => (current === created.id ? null : current)), 220)
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleConnectNodes(sourceId, targetId) {
    await persistFields(targetId, { parentId: sourceId })
  }

  function handleConnectToPane({ position, parentId }) {
    handleCreate({ position, shape: lastShapeRef.current, parentId })
  }

  async function handleDeleteSelected() {
    if (!selectedId || titleEditing) return
    const node = nodesRef.current.find((item) => item.id === selectedId)
    if (!window.confirm(`Remover “${node?.title || 'este nó'}”?`)) return
    try {
      await deleteNode(selectedId)
      setNodes((current) => current.filter((item) => item.id !== selectedId))
      setSelectedId(null)
    } catch (err) {
      setError(err.message)
    }
  }

  function pickShape(shape) {
    if (shape) lastShapeRef.current = shape
    setCreationMode(shape)
  }

  handlersRef.current = {
    onTitleChange: handleTitleChange,
    onStyleChange: handleStyleChange,
    onEditingChange: setTitleEditing,
  }

  const flowNodes = useMemo(
    () =>
      rawFlowNodes.map((node) => {
        if (node.type !== 'tech') return node
        return {
          ...node,
          data: {
            ...node.data,
            justCreated: node.id === justCreatedId,
            onTitleChange: (title) => handlersRef.current.onTitleChange(node.id, title),
            onStyleChange: (style) => handlersRef.current.onStyleChange(node.id, style),
            onEditingChange: (editing) => handlersRef.current.onEditingChange(editing),
          },
        }
      }),
    [justCreatedId, rawFlowNodes],
  )

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

  function goTo(nextPage) {
    if (nextPage === page) return
    runViewTransition(() => setPage(nextPage), nextPage === 'roadmap' ? 'to-roadmap' : 'to-chat')
  }

  if (!session) {
    if (publicView === 'landing') {
      return (
        <LandingPage
          onStart={() => {
            setAuthMode('register')
            runViewTransition(() => setPublicView('login'), 'fade')
          }}
          onLogin={() => {
            setAuthMode('login')
            runViewTransition(() => setPublicView('login'), 'fade')
          }}
        />
      )
    }
    return (
      <LoginPage
        initialMode={authMode}
        onBack={() => runViewTransition(() => setPublicView('landing'), 'fade')}
        onAuthenticated={(next) => runViewTransition(() => setSessionState(next), 'fade')}
      />
    )
  }

  return (
    <div className="app-shell-enter flex h-screen flex-col bg-void text-ink-primary">
      <ShellHeader
        page={page}
        setPage={goTo}
        session={session}
        health={health}
        onImport={handleImport}
        onLogout={() => {
          clearSession()
          setPublicView('landing')
          runViewTransition(() => setSessionState(null))
        }}
      />

      {page === 'roadmap' && error && (
        <p className="error-enter border-b border-danger/35 px-5 py-2 text-[13px] text-danger">{error}</p>
      )}

      <main className="page-stage">
      {page === 'chat' ? (
        <div className="flex min-h-0 flex-1">
          <ChatPage />
        </div>
      ) : page === 'summary' ? (
        <PageErrorBoundary>
          <SummaryPage nodes={nodes} />
        </PageErrorBoundary>
      ) : (
      <div className="relative flex min-h-0 flex-1">
        <SidebarToggle
          open={leftSidebarOpen}
          onToggle={() => {
            setLeftSidebarOpen((open) => {
              const next = !open
              localStorage.setItem('paperless_left_sidebar', next ? '1' : '0')
              return next
            })
          }}
        />
        <div className={`architect-shell ${leftSidebarOpen ? 'is-open' : ''}`}>
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
        </div>
        <div className="relative min-w-0 flex-1">
          {loadingNodes && (
            <div className="loading-pulse absolute inset-0 z-10 flex items-center justify-center bg-surface/85 text-[13px] font-medium text-ink-secondary backdrop-blur-md">
              Carregando roadmap…
            </div>
          )}
          {!loadingNodes && nodes.length === 0 && (
            <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 px-6 text-center">
              <p className="empty-fade font-display text-[22px] font-semibold text-ink-primary">Nenhum nó cadastrado.</p>
              <p className="empty-fade empty-fade-2 text-[13px] text-ink-secondary">
                Escolha uma forma à esquerda e clique no mapa.
              </p>
            </div>
          )}
          <RoadmapCanvas
            flowNodes={flowNodes}
            flowEdges={flowEdges}
            creationMode={creationMode}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onMove={handleMove}
            onCreate={handleCreate}
            onConnectNodes={handleConnectNodes}
            onConnectToPane={handleConnectToPane}
            onPickShape={pickShape}
            onDeleteSelected={handleDeleteSelected}
          />
        </div>
        <div
          className={`node-shell ${selected ? 'is-open' : ''}`}
          onTransitionEnd={(event) => {
            if (event.target !== event.currentTarget) return
            if (event.propertyName !== 'width') return
            if (!selected) setPanelNode(null)
          }}
        >
          {(selected ?? panelNode) ? (
            <NodePanel
              node={selected ?? panelNode}
              childrenNodes={nodes.filter((item) => item.parentId === (selected ?? panelNode).id)}
              onChanged={upsertNode}
              onDeleted={(id) => {
                setNodes((current) => current.filter((node) => node.id !== id))
                setSelectedId(null)
              }}
              onError={setError}
            />
          ) : null}
        </div>
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
  onImport,
  onLogout,
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPos, setMenuPos] = useState(null)
  const menuRef = useRef(null)
  const panelRef = useRef(null)
  const menuBtnRef = useRef(null)

  useLayoutEffect(() => {
    if (!menuOpen || !menuBtnRef.current) return undefined
    const place = () => {
      const box = menuBtnRef.current.getBoundingClientRect()
      setMenuPos({
        top: Math.round(box.bottom + 10),
        right: Math.round(window.innerWidth - box.right),
      })
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [menuOpen])

  useEffect(() => {
    if (!menuOpen) return undefined
    const close = (event) => {
      const inButton = menuRef.current?.contains(event.target)
      const inPanel = panelRef.current?.contains(event.target)
      if (!inButton && !inPanel) setMenuOpen(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [menuOpen])

  const menuPanel =
    menuOpen && menuPos
      ? createPortal(
          <div
            ref={panelRef}
            className="menu-enter shadow-soft w-64 rounded-2xl border border-black/10 bg-white p-3"
            role="menu"
            style={{
              position: 'fixed',
              top: menuPos.top,
              right: menuPos.right,
              zIndex: 90,
            }}
          >
            <p className="truncate text-[13px] font-medium text-ink-secondary">{session.email}</p>
            <p className="mt-1 font-mono text-[11px] font-medium tracking-wide text-ink-tertiary">
              API {health}
            </p>
            <nav className="mt-3 flex gap-1 border-t border-hairline pt-3 md:hidden">
              <button
                className={`flex-1 rounded-full px-3 py-1.5 text-[13px] font-medium ${page === 'roadmap' ? 'bg-black text-white' : 'text-ink-secondary'}`}
                type="button"
                onClick={() => {
                  setPage('roadmap')
                  setMenuOpen(false)
                }}
              >
                Roadmap
              </button>
              <button
                className={`flex-1 rounded-full px-3 py-1.5 text-[13px] font-medium ${page === 'chat' ? 'bg-black text-white' : 'text-ink-secondary'}`}
                type="button"
                onClick={() => {
                  setPage('chat')
                  setMenuOpen(false)
                }}
              >
                Chat
              </button>
              <button
                className={`flex-1 rounded-full px-3 py-1.5 text-[13px] font-medium ${page === 'summary' ? 'bg-black text-white' : 'text-ink-secondary'}`}
                type="button"
                onClick={() => {
                  setPage('summary')
                  setMenuOpen(false)
                }}
              >
                Summary
              </button>
            </nav>

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
          </div>,
          document.getElementById('root') ?? document.body,
        )
      : null

  return (
    <header className="shell-header-enter relative z-50 shrink-0 px-4 pt-4 pb-2">
      <div className="header-pill relative mx-auto flex h-14 max-w-[1180px] items-center justify-between px-3">
        <AppLogo size="sm" textClassName="text-[16px]" />

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex">
          <button
            className={`rounded-full px-4 py-1.5 text-[14px] font-medium tracking-wide transition-colors duration-300 ${
              page === 'roadmap' ? 'bg-black/[0.06] text-ink-primary' : 'text-ink-secondary hover:text-ink-primary'
            }`}
            type="button"
            onClick={() => setPage('roadmap')}
          >
            Roadmap
          </button>
          <button
            className={`rounded-full px-4 py-1.5 text-[14px] font-medium tracking-wide transition-colors duration-300 ${
              page === 'chat' ? 'bg-black/[0.06] text-ink-primary' : 'text-ink-secondary hover:text-ink-primary'
            }`}
            type="button"
            onClick={() => setPage('chat')}
          >
            Chat de cursos
          </button>
          <button
            className={`rounded-full px-4 py-1.5 text-[14px] font-medium tracking-wide transition-colors duration-300 ${
              page === 'summary' ? 'bg-black/[0.06] text-ink-primary' : 'text-ink-secondary hover:text-ink-primary'
            }`}
            type="button"
            onClick={() => setPage('summary')}
          >
            Summary
          </button>
        </nav>

        <div className="flex items-center gap-2">
          <p className="hidden max-w-[160px] truncate px-2 text-[13px] font-medium text-ink-secondary lg:block">
            {session.email}
          </p>
          <div className="relative" ref={menuRef}>
            <button
              ref={menuBtnRef}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-label="Abrir menu"
              className="btn-ink flex h-10 items-center gap-2 rounded-full bg-[#2c2c2c] px-4 text-[13px] font-semibold text-white hover:bg-black"
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
            >
              Menu
              <MoreHorizontal size={16} strokeWidth={2} />
            </button>
            {menuPanel}
          </div>
        </div>
      </div>
    </header>
  )
}
