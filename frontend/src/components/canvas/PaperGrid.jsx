import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore, useViewport } from '@xyflow/react'
import {
  flowToScreen,
  GRID_EASE,
  MAJOR_GAP,
  MINOR_GAP,
  minorVisibility,
  nodeCenter,
} from '../../canvas/grid.js'

function lineGradient(alpha) {
  return `linear-gradient(to right, rgb(var(--grid-line) / ${alpha}) 1px, transparent 1px),
    linear-gradient(to bottom, rgb(var(--grid-line) / ${alpha}) 1px, transparent 1px)`
}

export default function PaperGrid({
  selectedId,
  draggingId,
  snapGuide,
  snapPulse,
  reducedMotion,
}) {
  const { x, y, zoom } = useViewport()
  const nodes = useStore((state) => state.nodes)
  const minor = minorVisibility(zoom)
  const [pulse, setPulse] = useState(null)

  const selected = useMemo(
    () => (selectedId ? nodes.find((node) => node.id === selectedId) : null),
    [nodes, selectedId],
  )
  const dragging = useMemo(
    () => (draggingId ? nodes.find((node) => node.id === draggingId) : null),
    [draggingId, nodes],
  )

  const selectedScreen = selected ? flowToScreen(nodeCenter(selected), { x, y, zoom }) : null
  const draggingScreen = dragging ? flowToScreen(nodeCenter(dragging), { x, y, zoom }) : null
  const guideFrom = snapGuide?.from ? flowToScreen(snapGuide.from, { x, y, zoom }) : null
  const guideTo = snapGuide?.to ? flowToScreen(snapGuide.to, { x, y, zoom }) : null

  useEffect(() => {
    if (!snapPulse) return undefined
    setPulse(snapPulse)
    const timer = window.setTimeout(() => setPulse(null), 480)
    return () => window.clearTimeout(timer)
  }, [snapPulse])

  const minorSize = `${MINOR_GAP * zoom}px ${MINOR_GAP * zoom}px`
  const majorSize = `${MAJOR_GAP * zoom}px ${MAJOR_GAP * zoom}px`
  const origin = `${x}px ${y}px`
  const minorAlpha = (reducedMotion ? 0.05 : 0.055 * minor).toFixed(3)
  const majorAlpha = 0.1

  const gridStyle = {
    backgroundPosition: `${origin}, ${origin}`,
    willChange: 'background-position, background-size, opacity',
  }

  return (
    <div className="paper-grid" aria-hidden="true">
      <div
        className="paper-grid-layer paper-grid-minor"
        style={{
          ...gridStyle,
          backgroundImage: lineGradient(minorAlpha),
          backgroundSize: `${minorSize}, ${minorSize}`,
          opacity: reducedMotion ? 1 : 0.55 + minor * 0.45,
        }}
      />
      <div
        className="paper-grid-layer paper-grid-major"
        style={{
          ...gridStyle,
          backgroundImage: lineGradient(majorAlpha),
          backgroundSize: `${majorSize}, ${majorSize}`,
        }}
      />

      {selectedScreen && !reducedMotion ? (
        <div
          className="paper-grid-select"
          style={{
            background: `radial-gradient(circle 320px at ${selectedScreen.x}px ${selectedScreen.y}px, transparent 0%, rgb(24 20 16 / 0.045) 72%)`,
          }}
        />
      ) : null}

      {draggingScreen && !reducedMotion ? (
        <div
          className="paper-grid-drag"
          style={{
            background: `radial-gradient(circle 240px at ${draggingScreen.x}px ${draggingScreen.y}px, rgb(254 244 1 / 0.16) 0%, transparent 70%)`,
          }}
        />
      ) : null}

      {snapGuide?.near && guideFrom && guideTo && !reducedMotion ? (
        <svg className="paper-grid-guide">
          <line
            x1={guideFrom.x}
            y1={guideFrom.y}
            x2={guideTo.x}
            y2={guideTo.y}
            stroke="rgb(var(--grid-line) / 0.45)"
            strokeWidth="1"
            strokeDasharray="3 4"
          />
          <circle cx={guideTo.x} cy={guideTo.y} r="3.5" fill="rgb(var(--grid-line) / 0.55)" />
        </svg>
      ) : null}

      <AnimatePresence>
        {pulse && !reducedMotion ? (
          <motion.span
            key={pulse.key}
            className="paper-grid-pulse"
            style={{ left: pulse.x, top: pulse.y }}
            initial={{ scale: 0.35, opacity: 0.55 }}
            animate={{ scale: 2.6, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.42, ease: GRID_EASE }}
          />
        ) : null}
      </AnimatePresence>
    </div>
  )
}
