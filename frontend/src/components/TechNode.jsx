import { memo, useEffect, useRef, useState } from 'react'
import { Handle, NodeResizer, NodeToolbar, Position } from '@xyflow/react'
import {
  clampSize,
  DEFAULT_TITLE,
  MAX_HEIGHT,
  MAX_WIDTH,
  MIN_HEIGHT,
  MIN_WIDTH,
  resolveStyle,
  shapeClass,
} from '../nodeStyle.js'
import NodeStyleBar from './NodeStyleBar.jsx'
import StatusDot from './StatusDot.jsx'

const handleClass = 'tech-handle !h-2.5 !w-2.5 !border-2 !border-black !bg-white'

function TechNode({ data, selected }) {
  const style = resolveStyle(data.style, data.role)
  const diamond = style.shape === 'diamond'
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(data.title === DEFAULT_TITLE ? '' : data.title)
  const inputRef = useRef(null)

  useEffect(() => {
    setDraft(data.title === DEFAULT_TITLE ? '' : data.title)
    setEditing(false)
  }, [data.nodeId, data.title])

  useEffect(() => {
    data.onEditingChange?.(editing)
  }, [data, editing])

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
    }
  }, [editing])

  function commit() {
    const next = draft.trim() || DEFAULT_TITLE
    setEditing(false)
    if (next !== data.title) {
      data.onTitleChange?.(next)
    }
  }

  function cancel() {
    setDraft(data.title === DEFAULT_TITLE ? '' : data.title)
    setEditing(false)
  }

  return (
    <div
      className={`tech-node relative box-border flex h-full w-full items-center justify-center text-center ${
        diamond ? 'border-0 bg-transparent' : `border-2 px-4 py-3 ${shapeClass(style.shape)}`
      } ${selected ? 'tech-node-selected' : ''} ${data.highlighted ? 'tech-node-ai' : ''} ${
        data.justCreated ? 'tech-node-enter' : ''
      }`}
      style={
        diamond
          ? { color: style.textColor }
          : {
              background: style.fill,
              borderColor: style.border,
              color: style.textColor,
            }
      }
    >
      <NodeResizer
        isVisible={selected && !editing}
        minWidth={MIN_WIDTH}
        minHeight={MIN_HEIGHT}
        maxWidth={MAX_WIDTH}
        maxHeight={MAX_HEIGHT}
        onResizeEnd={(_, params) =>
          data.onStyleChange?.({
            width: clampSize(params.width, MIN_WIDTH, MAX_WIDTH, style.width),
            height: clampSize(params.height, MIN_HEIGHT, MAX_HEIGHT, style.height),
          })
        }
      />
      {selected ? (
        <NodeToolbar isVisible position={Position.Top} offset={18} className="nodrag nopan">
          <NodeStyleBar style={style} onChange={(partial) => data.onStyleChange?.(partial)} />
        </NodeToolbar>
      ) : null}

      {diamond ? (
        <>
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
              background: style.border,
            }}
          />
          <div
            className="pointer-events-none absolute inset-[3px]"
            style={{
              clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
              background: style.fill,
            }}
          />
        </>
      ) : null}

      <Handle type="target" id="in" position={Position.Left} className={handleClass} />
      <Handle type="source" id="out" position={Position.Right} className={handleClass} />

      <span className={`absolute z-10 ${diamond ? 'right-1/2 top-8 translate-x-1/2' : 'right-2 top-2'}`}>
        <StatusDot status={data.status} />
      </span>

      {editing ? (
        <input
          ref={inputRef}
          className="tech-node-title nodrag nopan relative z-10 w-[86%] bg-transparent text-center outline-none"
          placeholder={DEFAULT_TITLE}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              commit()
            }
            if (event.key === 'Escape') {
              event.preventDefault()
              event.stopPropagation()
              cancel()
            }
          }}
          style={{
            color: style.textColor,
            fontSize: style.fontSize,
            fontWeight: style.bold ? 700 : 500,
          }}
        />
      ) : (
        <p
          className={`relative z-10 leading-snug tracking-tight ${
            diamond ? 'flex h-full items-center justify-center px-6' : 'pr-5'
          } ${data.role === 'option' ? 'font-sans' : 'font-display'}`}
          style={{ fontSize: style.fontSize, fontWeight: style.bold ? 700 : 600 }}
          onDoubleClick={(event) => {
            event.stopPropagation()
            setEditing(true)
          }}
        >
          {data.title}
        </p>
      )}
    </div>
  )
}

export default memo(TechNode)
