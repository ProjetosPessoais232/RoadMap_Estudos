export default function ClusterTitle({ data }) {
  return (
    <p className="pointer-events-none font-display text-[13px] font-semibold tracking-[0.06em] text-ink-secondary">
      {data.title}
    </p>
  )
}
