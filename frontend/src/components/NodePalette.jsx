import { SHAPES } from '../nodeStyle.js'

const LABELS = {
  rounded: 'Arredondado',
  rectangle: 'Retângulo',
  pill: 'Pílula',
  diamond: 'Losango',
}

function ShapePreview({ shape }) {
  if (shape === 'diamond') {
    return (
      <span
        className="block h-5 w-5 border-2 border-black bg-node-option"
        style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
      />
    )
  }
  const radius =
    shape === 'rectangle' ? 'rounded-none' : shape === 'pill' ? 'rounded-full' : 'rounded-md'
  return <span className={`block h-4 w-7 border-2 border-black bg-node-main ${radius}`} />
}

export default function NodePalette({ creationMode, onPick }) {
  return (
    <aside className="node-palette absolute left-3 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-1 rounded-2xl border-2 border-node-border bg-white p-1.5">
      {SHAPES.map((shape) => {
        const active = creationMode === shape
        return (
          <button
            key={shape}
            aria-label={LABELS[shape]}
            aria-pressed={active}
            className={`node-palette-item flex h-10 w-10 items-center justify-center rounded-xl ${
              active ? 'bg-black/[0.08]' : 'bg-white hover:bg-black/[0.04]'
            }`}
            data-active={active ? 'true' : 'false'}
            type="button"
            onClick={() => onPick(active ? null : shape)}
          >
            <ShapePreview shape={shape} />
          </button>
        )
      })}
    </aside>
  )
}
