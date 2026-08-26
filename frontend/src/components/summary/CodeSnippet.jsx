import { useEffect, useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { highlightCode } from './highlight.js'

export default function CodeSnippet({ code, language = 'code' }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef(0)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      const field = document.createElement('textarea')
      field.value = code
      field.setAttribute('readonly', '')
      field.style.position = 'fixed'
      field.style.left = '-9999px'
      document.body.appendChild(field)
      field.select()
      document.execCommand('copy')
      document.body.removeChild(field)
    }
    setCopied(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <figure className="note-code">
      <div className="note-code-chrome">
        <span className="note-code-dots" aria-hidden="true">
          <i className="is-close" />
          <i className="is-min" />
          <i className="is-max" />
        </span>
        <span className="note-code-lang">{language || 'code'}</span>
        <button
          className={`note-code-copy ${copied ? 'is-on' : ''}`}
          type="button"
          onClick={copyCode}
          aria-label={copied ? 'Código copiado' : 'Copiar código'}
        >
          {copied ? <Check size={14} strokeWidth={2.4} /> : <Copy size={14} strokeWidth={2.2} />}
        </button>
      </div>
      <pre className="note-code-body">
        <code>
          {highlightCode(code, language).map((token, tokenIndex) => (
            <span key={tokenIndex} className={`tok tok-${token.type}`}>
              {token.value}
            </span>
          ))}
        </code>
      </pre>
    </figure>
  )
}
