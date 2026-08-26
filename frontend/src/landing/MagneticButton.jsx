import { useRef } from 'react'

export default function MagneticButton({ className, children, onClick, type = 'button' }) {
  const ref = useRef(null)

  function onMove(event) {
    const node = ref.current
    if (!node || window.matchMedia('(pointer: coarse)').matches) return
    const rect = node.getBoundingClientRect()
    const mx = event.clientX - (rect.left + rect.width / 2)
    const my = event.clientY - (rect.top + rect.height / 2)
    const dist = Math.hypot(mx, my)
    if (dist > 72) {
      node.style.transform = ''
      return
    }
    node.style.transform = `translate(${mx * 0.18}px, ${my * 0.18}px)`
  }

  function onLeave() {
    if (ref.current) ref.current.style.transform = ''
  }

  return (
    <button
      ref={ref}
      className={className}
      type={type}
      onClick={onClick}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      {children}
    </button>
  )
}
