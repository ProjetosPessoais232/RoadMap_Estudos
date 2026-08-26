const ICON_SIZES = {
  sm: 'h-8 w-8',
  md: 'h-9 w-9',
  lg: 'h-16 w-16',
  xl: 'h-24 w-24',
}

export default function AppLogo({ size = 'md', showText = true, textClassName = '' }) {
  if (!showText) {
    return (
      <img
        src="/logo.png"
        alt="Paperless"
        className={`${ICON_SIZES[size] || ICON_SIZES.md} shrink-0 object-contain transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-105`}
      />
    )
  }

  return (
    <span
      className={`inline-flex min-w-0 items-center font-display font-semibold tracking-tight text-ink-primary ${textClassName}`}
      aria-label="Paperless"
    >
      <img
        src="/logo.png"
        alt=""
        aria-hidden="true"
        className="mr-[-0.08em] h-[1.42em] w-[1.42em] shrink-0 object-contain transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-105"
      />
      <span className="sr-only">P</span>
      <span className="truncate">aperless</span>
    </span>
  )
}
