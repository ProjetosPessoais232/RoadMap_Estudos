import { memo } from 'react'
import { getSmoothStepPath } from '@xyflow/react'

function ObservatoryEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}) {
  const option = data?.variant === 'option'
  const [path] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 12,
  })
  const dist = Math.hypot(targetX - sourceX, targetY - sourceY)
  const halo = dist < 280 ? 0.14 : 0.05
  const color = option ? 'var(--color-edge-option)' : 'var(--color-edge-primary)'

  return (
    <g className="observatory-edge">
      <path d={path} fill="none" stroke={color} strokeWidth={12} opacity={halo} />
      <path
        id={id}
        className={option ? 'observatory-edge-dash' : 'observatory-edge-draw'}
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeDasharray={option ? '6 4' : undefined}
        pathLength={option ? undefined : 1}
      />
    </g>
  )
}

export default memo(ObservatoryEdge)
