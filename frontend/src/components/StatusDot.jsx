import { Check } from 'lucide-react'

export const STATUS_LEGEND = [
  { status: 'NOT_STARTED', label: 'Não iniciado' },
  { status: 'IN_PROGRESS', label: 'Em andamento' },
  { status: 'COMPLETED', label: 'Concluído' },
]

export default function StatusDot({ status }) {
  if (status === 'IN_PROGRESS') {
    return (
      <span
        className="inline-block h-2 w-2 shrink-0 rounded-full bg-accent"
        aria-hidden="true"
      />
    )
  }

  if (status === 'COMPLETED') {
    return (
      <span
        className="inline-flex h-2.5 w-2.5 shrink-0 items-center justify-center rounded-full border border-status-done text-status-done"
        aria-hidden="true"
      >
        <Check size={8} strokeWidth={2} />
      </span>
    )
  }

  return (
    <span
      className="inline-block h-2 w-2 shrink-0 rounded-full border border-ink-tertiary bg-transparent"
      aria-hidden="true"
    />
  )
}
