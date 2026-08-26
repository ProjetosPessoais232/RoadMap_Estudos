export const SHAPES = ['rounded', 'rectangle', 'pill', 'diamond']
export const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28]
export const DEFAULT_TITLE = 'Novo nó'
export const MIN_WIDTH = 80
export const MAX_WIDTH = 560
export const MIN_HEIGHT = 40
export const MAX_HEIGHT = 400

export function clampSize(value, min, max, fallback) {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, Math.round(n)))
}

export function defaultSize(shape) {
  if (shape === 'diamond') return { width: 168, height: 168 }
  return { width: 176, height: 56 }
}

export function defaultStyle(shape, isRoot) {
  const chosen = SHAPES.includes(shape) ? shape : 'rounded'
  return {
    shape: chosen,
    fill: isRoot ? '#FEF401' : '#FFE8B3',
    border: '#000000',
    textColor: '#111111',
    fontSize: 14,
    bold: true,
    ...defaultSize(chosen),
  }
}

export function resolveStyle(style, role) {
  const fallback = defaultStyle(style?.shape || 'rounded', role === 'main')
  if (style?.shape) {
    return {
      shape: SHAPES.includes(style.shape) ? style.shape : 'rounded',
      fill: style.fill || fallback.fill,
      border: style.border || '#000000',
      textColor: style.textColor || '#111111',
      fontSize: FONT_SIZES.includes(style.fontSize) ? style.fontSize : 14,
      bold: style.bold !== false,
      width: clampSize(style.width, MIN_WIDTH, MAX_WIDTH, fallback.width),
      height: clampSize(style.height, MIN_HEIGHT, MAX_HEIGHT, fallback.height),
    }
  }
  return fallback
}

export function shapeClass(shape) {
  if (shape === 'rectangle') return 'rounded-none'
  if (shape === 'pill') return 'rounded-full'
  if (shape === 'diamond') return 'rounded-none'
  return 'rounded-xl'
}
