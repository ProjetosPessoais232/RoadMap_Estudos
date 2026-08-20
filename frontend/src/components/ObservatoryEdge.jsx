import { getSmoothStepPath } from '@xyflow/react'

export default function ObservatoryEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
}) {
  const [path] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  })

  return (
    <g>
      <path
        id={id}
        d={path}
        fill="none"
        stroke="var(--color-hairline)"
        strokeWidth={1}
      />
      <circle cx={targetX} cy={targetY} r={2} fill="var(--color-ink-tertiary)" />
    </g>
  )
}
