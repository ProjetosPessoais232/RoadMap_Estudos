import dagre from '@dagrejs/dagre'
import { resolveStyle } from './nodeStyle.js'

export const NODE_W = 176
export const NODE_H = 56
export const OPTION_COL_W = 188
export const OPTION_ROW_H = 68
export const OPTION_OFFSET_X = 220

export function needsAutoLayout(nodes) {
  return nodes.length > 0 && nodes.every((node) => !node.posX && !node.posY)
}

export function applyLoadedLayout(nodes) {
  if (!needsAutoLayout(nodes)) {
    return nodes
  }
  const placed = layoutWithDagre(nodes)
  const noStyle = nodes.every((node) => !node.style)
  return noStyle ? layoutOptionClusters(placed) : placed
}

export function nextOptionPosition(parent, childCount) {
  const col = childCount % 2
  const row = Math.floor(childCount / 2)
  return {
    posX: (parent.posX ?? 0) + OPTION_OFFSET_X + col * OPTION_COL_W,
    posY: (parent.posY ?? 0) + row * OPTION_ROW_H,
  }
}

export function layoutWithDagre(apiNodes) {
  const graph = new dagre.graphlib.Graph()
  graph.setDefaultEdgeLabel(() => ({}))
  graph.setGraph({ rankdir: 'LR', nodesep: 36, ranksep: 100 })

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

export function layoutOptionClusters(apiNodes) {
  const parentIds = new Set(apiNodes.filter((node) => node.parentId).map((node) => node.parentId))
  const byId = new Map(apiNodes.map((node) => [node.id, { ...node }]))
  const byParent = new Map()

  for (const node of byId.values()) {
    if (!node.parentId) continue
    const group = byParent.get(node.parentId) || []
    group.push(node)
    byParent.set(node.parentId, group)
  }

  for (const [parentId, children] of byParent) {
    const parent = byId.get(parentId)
    if (!parent) continue
    const options = children
      .filter((child) => !parentIds.has(child.id))
      .sort((a, b) => (a.posY ?? 0) - (b.posY ?? 0) || (a.posX ?? 0) - (b.posX ?? 0))
    options.forEach((child, index) => {
      const slot = nextOptionPosition(parent, index)
      child.posX = slot.posX
      child.posY = slot.posY
    })
  }

  return apiNodes.map((node) => byId.get(node.id) || node)
}

export function toFlowElements(apiNodes, highlightedIds) {
  const highlight = new Set(highlightedIds)
  const parentIds = new Set(apiNodes.filter((node) => node.parentId).map((node) => node.parentId))

  const nodes = [
    ...originStem(apiNodes),
    ...clusterTitles(apiNodes),
    ...apiNodes.map((node) => {
      const role = nodeRole(node, parentIds)
      const style = resolveStyle(node.style, role)
      return {
        id: node.id,
        type: 'tech',
        position: { x: node.posX ?? 0, y: node.posY ?? 0 },
        width: style.width,
        height: style.height,
        style: { width: style.width, height: style.height },
        data: {
          title: node.title,
          nodeId: node.id,
          status: node.status,
          highlighted: highlight.has(node.id),
          role,
          style: node.style || null,
        },
      }
    }),
  ]

  const edges = apiNodes
    .filter((node) => node.parentId)
    .map((node) => {
      const option = nodeRole(node, parentIds) === 'option'
      return {
        id: `${node.parentId}-${node.id}`,
        source: node.parentId,
        target: node.id,
        sourceHandle: 'out',
        targetHandle: 'in',
        type: 'observatory',
        data: { variant: option ? 'option' : 'primary' },
      }
    })

  return { nodes, edges }
}

function nodeRole(node, parentIds) {
  if (!node.parentId || parentIds.has(node.id)) return 'main'
  return 'option'
}

function originStem(apiNodes) {
  const roots = apiNodes.filter((node) => !node.parentId)
  if (roots.length === 0) return []
  const first = [...roots].sort(
    (a, b) => (a.posY ?? 0) - (b.posY ?? 0) || (a.posX ?? 0) - (b.posX ?? 0),
  )[0]
  return [
    {
      id: '__origin',
      type: 'originStem',
      position: { x: (first.posX ?? 0) + NODE_W / 2, y: (first.posY ?? 0) - 68 },
      draggable: false,
      selectable: false,
      connectable: false,
      data: {},
    },
  ]
}

function clusterTitles(apiNodes) {
  const roots = apiNodes.filter((node) => !node.parentId)
  return roots.flatMap((root) => {
    const children = apiNodes.filter((node) => node.parentId === root.id)
    if (children.length === 0) return []
    const members = children
    const minX = Math.min(...members.map((node) => node.posX ?? 0))
    const minY = Math.min(...members.map((node) => node.posY ?? 0))
    return [
      {
        id: `__cluster-${root.id}`,
        type: 'clusterTitle',
        position: { x: minX, y: minY - 28 },
        draggable: false,
        selectable: false,
        connectable: false,
        data: { title: root.title },
      },
    ]
  })
}
