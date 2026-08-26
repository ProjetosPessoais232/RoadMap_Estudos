export default function ClusterTitle({ data }) {
  return (
    <p className="pointer-events-none inline-block rounded-lg border-2 border-node-border bg-node-main px-3 py-1 font-display text-[12px] font-semibold tracking-wide text-ink-primary">
      {data.title}
    </p>
  )
}
