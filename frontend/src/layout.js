import dagre from '@dagrejs/dagre'

const NODE_W = 180
const NODE_H = 72

export function needsAutoLayout(nodes) {
  return nodes.length > 0 && nodes.every((node) => !node.posX && !node.posY)
}

export function layoutWithDagre(apiNodes) {
  const graph = new dagre.graphlib.Graph()
  graph.setDefaultEdgeLabel(() => ({}))
  graph.setGraph({ rankdir: 'LR', nodesep: 48, ranksep: 90 })

  for (const node of apiNodes) {
    graph.setNode(node.id, { width: NODE_W, height: NODE_H })
  }
  for (const node of apiNodes) {
    if (node.parentId) {
      graph.setEdge(node.parentId, node.id)
    }
  }

  dagre.layout(graph)

  return apiNodes.map((node) => {
    const position = graph.node(node.id)
    return {
      ...node,
      posX: position.x - NODE_W / 2,
      posY: position.y - NODE_H / 2,
    }
  })
}

export function toFlowElements(apiNodes, highlightedIds) {
  const highlight = new Set(highlightedIds)
  const nodes = apiNodes.map((node) => ({
    id: node.id,
    type: 'tech',
    position: { x: node.posX ?? 0, y: node.posY ?? 0 },
    data: {
      title: node.title,
      nodeId: node.id,
      status: node.status,
      highlighted: highlight.has(node.id),
    },
  }))
  const edges = apiNodes
    .filter((node) => node.parentId)
    .map((node) => ({
      id: `${node.parentId}-${node.id}`,
      source: node.parentId,
      target: node.id,
      type: 'observatory',
    }))
  return { nodes, edges }
}
