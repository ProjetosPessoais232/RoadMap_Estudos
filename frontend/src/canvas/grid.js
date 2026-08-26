export const MINOR_GAP = 20
export const MAJOR_GAP = 100
export const SNAP_THRESHOLD = 10
export const SNAP_PULL = 0.42
export const GRID_EASE = [0.22, 1, 0.36, 1]

export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function minorVisibility(zoom) {
  const t = Math.min(1, Math.max(0, (zoom - 0.48) / 0.42))
  return t * t * (3 - 2 * t)
}

export function nearestMajor(pos) {
  return {
    x: Math.round(pos.x / MAJOR_GAP) * MAJOR_GAP,
    y: Math.round(pos.y / MAJOR_GAP) * MAJOR_GAP,
  }
}

export function magneticSnap(pos, threshold = SNAP_THRESHOLD) {
  const guide = nearestMajor(pos)
  const dist = Math.hypot(guide.x - pos.x, guide.y - pos.y)
  const near = dist <= threshold
  if (!near) {
    return { near: false, target: pos, guide, dist, exact: false }
  }
  return {
    near: true,
    exact: dist < 0.6,
    target: {
      x: pos.x + (guide.x - pos.x) * SNAP_PULL,
      y: pos.y + (guide.y - pos.y) * SNAP_PULL,
    },
    guide,
    dist,
  }
}

export function snapOnRelease(pos, threshold = SNAP_THRESHOLD) {
  const guide = nearestMajor(pos)
  const dist = Math.hypot(guide.x - pos.x, guide.y - pos.y)
  if (dist <= threshold) {
    return { snapped: true, position: guide, guide, dist }
  }
  return { snapped: false, position: pos, guide, dist }
}

export function flowToScreen(pos, viewport) {
  return {
    x: pos.x * viewport.zoom + viewport.x,
    y: pos.y * viewport.zoom + viewport.y,
  }
}

export function nodeCenter(node) {
  const width = node.measured?.width ?? node.width ?? 176
  const height = node.measured?.height ?? node.height ?? 56
  return {
    x: node.position.x + width / 2,
    y: node.position.y + height / 2,
  }
}
