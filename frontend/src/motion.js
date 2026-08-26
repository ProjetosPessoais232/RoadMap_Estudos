import { flushSync } from 'react-dom'

export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function runViewTransition(update, type = 'fade') {
  if (prefersReducedMotion() || typeof document.startViewTransition !== 'function') {
    update()
    return
  }
  const root = document.documentElement
  root.dataset.transition = type
  const transition = document.startViewTransition(() => {
    flushSync(update)
  })
  transition.finished.finally(() => {
    delete root.dataset.transition
  })
}
