import { useEffect, useRef, useState } from 'react'
import { clampSize, FONT_SIZES, MAX_HEIGHT, MAX_WIDTH, MIN_HEIGHT, MIN_WIDTH } from '../nodeStyle.js'

function toHex6(value) {
  if (!value) return '#000000'
  if (/^#[0-9A-Fa-f]{6}$/.test(value)) return value
  if (/^#[0-9A-Fa-f]{3}$/.test(value)) {
    const r = value[1]
    const g = value[2]
    const b = value[3]
    return `#${r}${r}${g}${g}${b}${b}`
  }
  return '#000000'
}

function SizeField({ label, short, value, min, max, onChange }) {
  const [local, setLocal] = useState(String(value))

  useEffect(() => {
    setLocal(String(value))
  }, [value])

  function commit() {
    onChange(clampSize(local, min, max, value))
  }

  return (
    <label className="flex items-center gap-1 text-[10px] font-semibold text-ink-tertiary" title={label}>
      {short}
      <input
        aria-label={label}
        className="h-7 w-12 rounded-md border border-black/15 bg-white px-1 text-[11px] font-semibold text-ink-primary outline-none"
        type="number"
        min={min}
        max={max}
        value={local}
        onChange={(event) => setLocal(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            commit()
          }
        }}
      />
    </label>
  )
}

function ColorSwatch({ label, value, onChange }) {
  const [local, setLocal] = useState(toHex6(value))
  const timerRef = useRef(0)

  useEffect(() => {
    setLocal(toHex6(value))
  }, [value])

  useEffect(() => () => window.clearTimeout(timerRef.current), [])

  return (
    <label className="flex items-center gap-1" title={label}>
      <span className="sr-only">{label}</span>
      <input
        className="h-7 w-7 cursor-pointer rounded border border-black/20 bg-white p-0"
        type="color"
        value={local}
        onChange={(event) => {
          const next = event.target.value
          setLocal(next)
          window.clearTimeout(timerRef.current)
          timerRef.current = window.setTimeout(() => onChange(next), 300)
        }}
      />
    </label>
  )
}

export default function NodeStyleBar({ style, onChange }) {
  return (
    <div className="node-style-bar flex items-center gap-2 rounded-xl border-2 border-node-border bg-white px-2 py-1.5">
      <ColorSwatch label="Preenchimento" value={style.fill} onChange={(fill) => onChange({ fill })} />
      <ColorSwatch label="Borda" value={style.border} onChange={(border) => onChange({ border })} />
      <ColorSwatch label="Texto" value={style.textColor} onChange={(textColor) => onChange({ textColor })} />
      <SizeField
        label="Largura"
        short="L"
        value={style.width}
        min={MIN_WIDTH}
        max={MAX_WIDTH}
        onChange={(width) => onChange({ width })}
      />
      <SizeField
        label="Altura"
        short="A"
        value={style.height}
        min={MIN_HEIGHT}
        max={MAX_HEIGHT}
        onChange={(height) => onChange({ height })}
      />
      <select
        aria-label="Tamanho da fonte"
        className="h-7 rounded-md border border-black/15 bg-white px-1 text-[11px] font-semibold text-ink-primary outline-none"
        value={style.fontSize}
        onChange={(event) => onChange({ fontSize: Number(event.target.value) })}
      >
        {FONT_SIZES.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
      <button
        aria-label="Negrito"
        aria-pressed={style.bold}
        className={`flex h-7 w-7 items-center justify-center rounded-md text-[13px] font-bold ${
          style.bold ? 'bg-black text-white' : 'bg-white text-ink-primary'
        }`}
        type="button"
        onClick={() => onChange({ bold: !style.bold })}
      >
        B
      </button>
    </div>
  )
}
