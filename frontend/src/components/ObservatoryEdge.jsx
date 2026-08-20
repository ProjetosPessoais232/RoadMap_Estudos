import { getSmoothStepPath } from '@xyflow/react'

export default function ObservatoryEdge({
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
    borderRadius: 0,
  })

  return (
    <path
      id={id}
      d={path}
      fill="none"
      stroke={option ? 'var(--color-hairline)' : 'var(--color-hairline-strong)'}
      strokeWidth={option ? 1 : 1.5}
      strokeDasharray={option ? '2 4' : undefined}
    />
  )
}
