import { useCallback } from 'react'
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
} from '@xyflow/react'
import ObservatoryEdge from './ObservatoryEdge.jsx'
import TechNode from './TechNode.jsx'

const nodeTypes = { tech: TechNode }
const edgeTypes = { observatory: ObservatoryEdge }

function minimapColor(node) {
  if (node.data.status === 'COMPLETED') return '#5c6470'
  if (node.data.status === 'IN_PROGRESS') return '#c57a4a'
  return '#4e5257'
}

function CanvasInner({ flowNodes, flowEdges, onSelect, onMove }) {
  const onNodeClick = useCallback((_, node) => onSelect(node.id), [onSelect])
  const onPaneClick = useCallback(() => onSelect(null), [onSelect])
  const onNodeDragStop = useCallback((_, node) => onMove(node.id, node.position), [onMove])

  return (
    <div className="observatory-vignette relative h-full w-full bg-void">
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
          id="observatory-dots"
          variant={BackgroundVariant.Dots}
          gap={28}
          size={1.15}
          color="rgba(255,255,255,0.08)"
        />
        <Controls className="!border-hairline !bg-surface !fill-ink-primary !shadow-none" />
        <MiniMap
          className="!border-hairline !bg-surface !shadow-none"
          maskColor="rgba(8,9,11,0.72)"
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
