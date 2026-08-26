const NODES = [
  { id: 'java', x: 70, y: 150, label: 'Java', fill: '#FEF401', done: true },
  { id: 'spring', x: 230, y: 90, label: 'Spring', fill: '#FEF401', pulse: true },
  { id: 'react', x: 230, y: 220, label: 'React', fill: '#FFE8B3' },
  { id: 'sql', x: 400, y: 150, label: 'Postgres', fill: '#FFE8B3' },
  { id: 'goal', x: 540, y: 150, label: 'Meta', fill: '#FEF401', flag: true },
]

const EDGES = [
  ['java', 'spring'],
  ['java', 'react'],
  ['spring', 'sql'],
  ['react', 'sql'],
  ['sql', 'goal'],
]

export default function HeroGraph({ highlight = 'spring', dimOthers = false }) {
  const byId = Object.fromEntries(NODES.map((node) => [node.id, node]))

  return (
    <svg className="landing-graph" viewBox="0 0 640 300" role="img" aria-label="Roadmap animado do Paperless">
      {EDGES.map(([from, to], index) => {
        const a = byId[from]
        const b = byId[to]
        return (
          <line
            key={`${from}-${to}`}
            className="landing-graph-edge"
            x1={a.x + 48}
            y1={a.y + 18}
            x2={b.x}
            y2={b.y + 18}
            style={{ animationDelay: `${700 + index * 100}ms` }}
          />
        )
      })}
      {NODES.map((node, index) => {
        const dim = dimOthers && highlight && node.id !== highlight
        return (
          <g
            key={node.id}
            className={`landing-graph-node ${node.pulse ? 'is-pulse' : ''} ${node.id === highlight ? 'is-hot' : ''} ${dim ? 'is-dim' : ''}`}
            style={{ animationDelay: `${1000 + index * 60}ms` }}
            data-cursor="hover"
          >
            <rect x={node.x} y={node.y} width="96" height="36" rx="12" fill={node.fill} />
            <text x={node.x + 48} y={node.y + 23} textAnchor="middle">
              {node.done ? '✓ ' : ''}
              {node.flag ? `${node.label} ⚑` : node.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
