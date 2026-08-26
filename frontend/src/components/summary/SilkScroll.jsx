import { useLayoutEffect, useEffect, useRef } from 'react'

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

export default function SilkScroll({
  as = 'div',
  className = '',
  paneClassName = '',
  paneRef: paneRefProp,
  children,
  ...paneProps
}) {
  const rootRef = useRef(null)
  const paneRef = useRef(null)

  function setPane(node) {
    paneRef.current = node
    if (typeof paneRefProp === 'function') paneRefProp(node)
    else if (paneRefProp) paneRefProp.current = node
  }
  const thumbRef = useRef(null)
  const railRef = useRef(null)
  const metricsRef = useRef(() => {})

  useEffect(() => {
    const pane = paneRef.current
    const thumb = thumbRef.current
    const rail = railRef.current
    const root = rootRef.current
    if (!pane || !thumb || !rail || !root) return undefined

    const state = {
      dragging: false,
      idle: 0,
      thumbHeight: 48,
    }

    function maxScroll() {
      return Math.max(0, pane.scrollHeight - pane.clientHeight)
    }

    function showRail() {
      root.classList.add('is-scrolling')
      window.clearTimeout(state.idle)
      state.idle = window.setTimeout(() => root.classList.remove('is-scrolling'), 920)
    }

    function updateThumb() {
      const overflow = maxScroll()
      const view = pane.clientHeight
      const total = pane.scrollHeight
      if (overflow < 2) {
        root.classList.add('is-fit')
        thumb.style.height = '0px'
        thumb.style.transform = 'translate3d(0,0,0)'
        return
      }
      root.classList.remove('is-fit')
      const track = Math.max(view - 20, 24)
      const nextHeight = clamp((view / total) * track, 36, track - 8)
      const maxThumb = Math.max(track - nextHeight, 1)
      const top = (pane.scrollTop / overflow) * maxThumb
      state.thumbHeight = nextHeight
      thumb.style.height = `${nextHeight}px`
      thumb.style.transform = `translate3d(0, ${top}px, 0)`
    }

    metricsRef.current = updateThumb

    function onScroll() {
      updateThumb()
      showRail()
    }

    function onPointerDown(event) {
      if (event.button !== 0) return
      const overflow = maxScroll()
      if (overflow < 2) return
      event.preventDefault()
      state.dragging = true
      root.classList.add('is-dragging')
      thumb.setPointerCapture(event.pointerId)
      const track = Math.max(pane.clientHeight - 20, 24)
      const maxThumb = Math.max(track - state.thumbHeight, 1)
      const railBox = rail.getBoundingClientRect()
      const local = event.clientY - railBox.top - state.thumbHeight / 2
      pane.scrollTop = clamp((local / maxThumb) * overflow, 0, overflow)
      showRail()
    }

    function onPointerMove(event) {
      if (!state.dragging) return
      const overflow = maxScroll()
      const track = Math.max(pane.clientHeight - 20, 24)
      const maxThumb = Math.max(track - state.thumbHeight, 1)
      const railBox = rail.getBoundingClientRect()
      const local = event.clientY - railBox.top - state.thumbHeight / 2
      pane.scrollTop = clamp((local / maxThumb) * overflow, 0, overflow)
    }

    function onPointerUp(event) {
      if (!state.dragging) return
      state.dragging = false
      root.classList.remove('is-dragging')
      if (thumb.hasPointerCapture(event.pointerId)) thumb.releasePointerCapture(event.pointerId)
    }

    const resize = new ResizeObserver(updateThumb)
    resize.observe(pane)
    if (pane.firstElementChild) resize.observe(pane.firstElementChild)

    pane.addEventListener('scroll', onScroll, { passive: true })
    rail.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    updateThumb()

    return () => {
      window.clearTimeout(state.idle)
      resize.disconnect()
      pane.removeEventListener('scroll', onScroll)
      rail.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }
  }, [])

  useLayoutEffect(() => {
    metricsRef.current()
  })

  return (
    <div ref={rootRef} className={`silk ${className}`.trim()}>
      {as === 'textarea' ? (
        <textarea ref={setPane} className={`silk-pane ${paneClassName}`.trim()} {...paneProps} />
      ) : (
        <div ref={setPane} className={`silk-pane ${paneClassName}`.trim()} {...paneProps}>
          {children}
        </div>
      )}
      <div ref={railRef} className="silk-rail" aria-hidden="true">
        <div ref={thumbRef} className="silk-thumb" />
      </div>
    </div>
  )
}
