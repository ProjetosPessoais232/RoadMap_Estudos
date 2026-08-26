import { Check } from 'lucide-react'

export const STATUS_LEGEND = [
  { status: 'NOT_STARTED', label: 'Não iniciado' },
  { status: 'IN_PROGRESS', label: 'Em progresso' },
  { status: 'COMPLETED', label: 'Concluído' },
]

export default function StatusDot({ status }) {
  if (status === 'IN_PROGRESS') {
    return (
      <span
        className="status-dot inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-node-border bg-status-now"
        aria-hidden="true"
      />
    )
  }

  if (status === 'COMPLETED') {
    return (
      <span
        className="status-dot inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-node-border bg-status-done text-white"
        aria-hidden="true"
      >
        <Check size={12} strokeWidth={3} />
      </span>
    )
  }

  return (
    <span
      className="status-dot inline-block h-5 w-5 shrink-0 rounded-full border-2 border-node-border bg-white"
      aria-hidden="true"
    />
  )
}
