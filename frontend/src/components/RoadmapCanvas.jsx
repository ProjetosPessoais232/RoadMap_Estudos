import { useCallback } from 'react'
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
} from '@xyflow/react'
import ClusterTitle from './ClusterTitle.jsx'
import ObservatoryEdge from './ObservatoryEdge.jsx'
import OriginStem from './OriginStem.jsx'
import TechNode from './TechNode.jsx'

const DECORATIVE = new Set(['clusterTitle', 'originStem'])
const nodeTypes = { tech: TechNode, clusterTitle: ClusterTitle, originStem: OriginStem }
const edgeTypes = { observatory: ObservatoryEdge }

function minimapColor(node) {
  if (DECORATIVE.has(node.type)) return 'transparent'
  if (node.data.role === 'main') return '#2b4c8c'
  return '#9a9890'
}

function CanvasInner({ flowNodes, flowEdges, onSelect, onMove }) {
  const onNodeClick = useCallback((_, node) => {
    if (DECORATIVE.has(node.type)) return
    onSelect(node.id)
  }, [onSelect])
  const onPaneClick = useCallback(() => onSelect(null), [onSelect])
  const onNodeDragStop = useCallback((_, node) => {
    if (DECORATIVE.has(node.type)) return
    onMove(node.id, node.position)
  }, [onMove])

  return (
    <div className="relative h-full w-full bg-void">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onNodeDragStop={onNodeDragStop}
        fitView
        minZoom={0.4}
        maxZoom={1.6}
        defaultEdgeOptions={{ type: 'observatory' }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          id="paper-dots"
          variant={BackgroundVariant.Dots}
          gap={28}
          size={1}
          color="rgba(0,0,0,0.08)"
        />
        <Controls className="!border-hairline !bg-surface !fill-ink-primary !shadow-none" />
        <MiniMap
          className="!border-hairline !bg-surface !shadow-none"
          maskColor="rgba(247,246,243,0.72)"
          nodeColor={minimapColor}
          nodeStrokeWidth={0}
        />
      </ReactFlow>
      <div className="paper-vignette-overlay pointer-events-none absolute inset-0" />
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
