import { ExternalLink } from 'lucide-react'

const PLATFORM_COLORS = {
  udemy: '#a435f0',
  youtube: '#ff0000',
  alura: '#2a7ae4',
  coursera: '#0056d2',
}

function platformColor(platform = '') {
  const normalized = platform.toLowerCase()
  return Object.entries(PLATFORM_COLORS).find(([name]) => normalized.includes(name))?.[1] || '#737373'
}

export default function CourseCard({ course, nodes, nodeLabel, selectedNodeId, onSelectNode, onSave, saved }) {
  const nodeId = course.node_id || selectedNodeId
  const platform = course.plataforma || 'Outra'

  return (
    <section className="card-enter card-lift rounded-xl border-2 border-node-border bg-white p-4">
      <div className="flex gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white" style={{ backgroundColor: platformColor(platform) }}>
          {platform.slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="text-[15px] font-semibold leading-snug text-ink-primary">{course.nome}</p>
          <p className="mt-1 font-mono text-[11px] font-medium tracking-wide text-ink-tertiary">{platform}</p>
        </div>
      </div>
      <a className="mt-3 flex items-center gap-1 truncate text-[12px] font-medium text-ink-secondary underline-offset-4 hover:text-accent hover:underline" href={course.url} target="_blank" rel="noreferrer">
        <span className="truncate">{course.url}</span><ExternalLink size={13} className="shrink-0" />
      </a>
      {course.node_id ? (
        <p className="mt-3 inline-flex rounded-full border border-node-border bg-node-option px-2 py-1 text-[11px] font-semibold text-ink-primary">
          Vinculado a: {nodeLabel[course.node_id] || course.node_id}
        </p>
      ) : (
        <select className="mt-3 w-full rounded-lg border-2 border-node-border bg-white px-2 py-2 text-[12px] font-medium text-ink-secondary outline-none" value={selectedNodeId || ''} onChange={(event) => onSelectNode(event.target.value)}>
          <option value="">Escolher nó do roadmap</option>
          {nodes.map((node) => <option key={node.id} value={node.id}>{node.title}</option>)}
        </select>
      )}
      <button className="btn-ink mt-3 w-full rounded-lg bg-black px-3 py-2 text-[13px] font-semibold text-white hover:opacity-90 disabled:bg-ink-tertiary disabled:opacity-70" disabled={saved || !nodeId} type="button" onClick={() => onSave(nodeId)}>
        {saved ? 'Salvo ✓' : 'Salvar no roadmap'}
      </button>
    </section>
  )
}
