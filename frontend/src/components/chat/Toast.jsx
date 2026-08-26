export default function Toast({ message }) {
  if (!message) return null
  return <div className="toast-enter pointer-events-none absolute bottom-5 right-5 z-20 rounded-lg border-2 border-node-border bg-white px-4 py-3 text-[13px] font-semibold text-ink-primary shadow-soft">{message}</div>
}
