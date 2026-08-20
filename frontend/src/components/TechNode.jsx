import { Handle, Position } from '@xyflow/react'
import StatusDot from './StatusDot.jsx'

const handleClass = '!h-1.5 !w-1.5 !border-0 !bg-ink-tertiary'

export default function TechNode({ data, selected }) {
  const option = data.role === 'option'

  return (
    <div
      className={`tech-node relative px-3.5 py-2.5 ${
        option
          ? 'w-[168px] border border-hairline bg-surface'
          : 'min-w-[176px] border-[1.5px] border-accent bg-accent-dim'
      } ${selected && option ? 'border-hairline-strong' : ''} ${data.highlighted ? 'tech-node-ai' : ''}`}
    >
      <Handle type="target" id="in" position={Position.Left} className={handleClass} />
      <Handle type="source" id="out" position={Position.Right} className={handleClass} />
      <span className="absolute right-1.5 top-1.5">
        <StatusDot status={data.status} />
      </span>
      <p
        className={`pr-5 leading-snug tracking-tight ${
          option
            ? 'font-sans text-[13px] font-medium text-ink-secondary'
            : 'font-display text-[15px] font-semibold text-ink-primary'
        }`}
      >
        {data.title}
      </p>
      <p className="mt-0.5 font-mono text-[11px] font-medium tracking-wide text-ink-tertiary">{data.nodeId}</p>
    </div>
  )
}
