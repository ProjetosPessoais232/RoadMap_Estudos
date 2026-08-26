import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from '@xyflow/react'
import ClusterTitle from './ClusterTitle.jsx'
import ObservatoryEdge from './ObservatoryEdge.jsx'
import OriginStem from './OriginStem.jsx'
import TechNode from './TechNode.jsx'
import NodePalette from './NodePalette.jsx'
import PaperGrid from './canvas/PaperGrid.jsx'
import {
  flowToScreen,
  magneticSnap,
  nodeCenter,
  prefersReducedMotion,
  snapOnRelease,
} from '../canvas/grid.js'

const DECORATIVE = new Set(['clusterTitle', 'originStem'])
const nodeTypes = { tech: TechNode, clusterTitle: ClusterTitle, originStem: OriginStem }
const edgeTypes = { observatory: ObservatoryEdge }

function minimapColor(node) {
  if (DECORATIVE.has(node.type)) return 'transparent'
  if (node.data?.style?.fill) return node.data.style.fill
  if (node.data.role === 'main') return '#fef401'
  return '#ffe8b3'
}

function endedOnPane(event) {
  const target = event.target
  if (!(target instanceof Element)) return false
  return Boolean(target.closest('.react-flow__pane'))
}

function CanvasInner({
  flowNodes,
  flowEdges,
  creationMode,
  selectedId,
  onSelect,
  onMove,
  onCreate,
  onConnectNodes,
  onConnectToPane,
  onPickShape,
  onDeleteSelected,
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges)
  const [draggingId, setDraggingId] = useState(null)
  const [snapGuide, setSnapGuide] = useState(null)
  const [snapPulse, setSnapPulse] = useState(null)
  const draggingRef = useRef(false)
  const skipPaneClickRef = useRef(false)
  const connectingFromRef = useRef(null)
  const reduced = useRef(false)
  const { screenToFlowPosition, getViewport } = useReactFlow()

  useEffect(() => {
    reduced.current = prefersReducedMotion()
  }, [])

  useEffect(() => {
    if (draggingRef.current) return
    setNodes(flowNodes)
    setEdges(flowEdges)
  }, [flowNodes, flowEdges, setNodes, setEdges])

  const onNodeClick = useCallback(
    (_, node) => {
      if (DECORATIVE.has(node.type)) return
      onSelect(node.id)
    },
    [onSelect],
  )

  const onPaneClick = useCallback(
    (event) => {
      if (skipPaneClickRef.current) {
        skipPaneClickRef.current = false
        return
      }
      if (creationMode) {
        const position = screenToFlowPosition({ x: event.clientX, y: event.clientY })
        onCreate({ position, shape: creationMode, parentId: null })
        return
      }
      onSelect(null)
    },
    [creationMode, onCreate, onSelect, screenToFlowPosition],
  )

  const onNodeDragStart = useCallback((_, node) => {
    draggingRef.current = true
    setDraggingId(node.id)
  }, [])

  const onNodeDrag = useCallback(
    (_, node) => {
      if (DECORATIVE.has(node.type) || reduced.current) return
      const result = magneticSnap(node.position)
      if (result.near) {
        setNodes((current) =>
          current.map((item) => (item.id === node.id ? { ...item, position: result.target } : item)),
        )
      }
      setSnapGuide({
        near: result.near,
        from: nodeCenter({ ...node, position: result.near ? result.target : node.position }),
        to: result.guide,
      })
    },
    [setNodes],
  )

  const onNodeDragStop = useCallback(
    (_, node) => {
      draggingRef.current = false
      setDraggingId(null)
      setSnapGuide(null)
      if (DECORATIVE.has(node.type)) return
      const released = snapOnRelease(node.position)
      if (released.snapped) {
        setNodes((current) =>
          current.map((item) => (item.id === node.id ? { ...item, position: released.position } : item)),
        )
        const screen = flowToScreen(released.guide, getViewport())
        setSnapPulse({ key: `${node.id}-${Date.now()}`, x: screen.x, y: screen.y })
      }
      onMove(node.id, released.position)
    },
    [getViewport, onMove, setNodes],
  )

  const onConnectStart = useCallback((_, params) => {
    connectingFromRef.current = params?.nodeId || null
  }, [])

  const onConnect = useCallback(
    (connection) => {
      if (!connection.source || !connection.target || connection.source === connection.target) return
      onConnectNodes(connection.source, connection.target)
    },
    [onConnectNodes],
  )

  const onConnectEnd = useCallback(
    (event, connectionState) => {
      if (connectionState?.isValid) {
        connectingFromRef.current = null
        return
      }
      const fromId = connectionState?.fromNode?.id || connectingFromRef.current
      connectingFromRef.current = null
      if (!fromId || !endedOnPane(event)) return
      skipPaneClickRef.current = true
      const point = 'changedTouches' in event ? event.changedTouches[0] : event
      const position = screenToFlowPosition({ x: point.clientX, y: point.clientY })
      onConnectToPane({ position, parentId: fromId })
    },
    [onConnectToPane, screenToFlowPosition],
  )

  useEffect(() => {
    function onKey(event) {
      if (event.key === 'Escape') {
        onPickShape(null)
        onSelect(null)
        return
      }
      if (event.key !== 'Delete' && event.key !== 'Backspace') return
      const el = document.activeElement
      const typing =
        el?.tagName === 'INPUT' ||
        el?.tagName === 'TEXTAREA' ||
        el?.tagName === 'SELECT' ||
        el?.isContentEditable
      if (typing || !selectedId) return
      event.preventDefault()
      onDeleteSelected()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onDeleteSelected, onPickShape, onSelect, selectedId])

  return (
    <div
      className={`roadmap-canvas relative h-full w-full ${creationMode ? 'is-creating-node' : ''} ${
        selectedId ? 'has-selection' : ''
      } ${draggingId ? 'is-dragging-node' : ''}`}
    >
      <NodePalette creationMode={creationMode} onPick={onPickShape} />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onNodeDragStart={onNodeDragStart}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        onConnectStart={onConnectStart}
        onConnect={onConnect}
        onConnectEnd={onConnectEnd}
        connectionRadius={28}
        selectNodesOnDrag={false}
        fitView
        minZoom={0.4}
        maxZoom={1.6}
        defaultEdgeOptions={{ type: 'observatory' }}
        proOptions={{ hideAttribution: true }}
      >
        <PaperGrid
          selectedId={selectedId}
          draggingId={draggingId}
          snapGuide={snapGuide}
          snapPulse={snapPulse}
          reducedMotion={reduced.current}
        />
        <Controls className="!border-node-border !bg-surface !fill-ink-primary !shadow-none" />
        <MiniMap
          className="!border-node-border !bg-surface !shadow-none"
          maskColor="rgba(247, 246, 242, 0.72)"
          nodeColor={minimapColor}
          nodeStrokeWidth={0}
        />
      </ReactFlow>
    </div>
  )
}

export default function RoadmapCanvas(props) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  )
}
