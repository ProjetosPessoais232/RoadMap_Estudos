import { Handle, Position } from '@xyflow/react'

const STATUS = {
  NOT_STARTED: 'border-hairline bg-transparent text-ink-tertiary',
  IN_PROGRESS: 'border-copper bg-copper-dim text-ink-primary',
  COMPLETED: 'border-status-done bg-surface-raised text-ink-primary',
}

export default function TechNode({ data, selected }) {
  const status = STATUS[data.status] ?? STATUS.NOT_STARTED
  const idle = data.status === 'NOT_STARTED'

  return (
    <div
      className={`tech-node min-w-[160px] border px-4 py-3 transition-transform duration-150 ease-out hover:scale-[1.01] ${status} ${
        selected ? 'border-hairline-strong' : ''
      } ${data.highlighted ? 'tech-node-ai' : ''}`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-1.5 !w-1.5 !border-0 !bg-ink-tertiary"
      />
      <p className={`font-sans text-[15px] font-bold leading-snug tracking-tight ${idle ? 'text-ink-tertiary' : 'text-ink-primary'}`}>
        {data.title}
      </p>
      <p className="mt-0.5 font-sans text-[11px] font-medium tracking-wide text-ink-tertiary">{data.nodeId}</p>
      <Handle
        type="source"
        position={Position.Right}
        className="!h-1.5 !w-1.5 !border-0 !bg-ink-tertiary"
      />
    </div>
  )
}
