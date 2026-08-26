import { NodeViewContent, NodeViewWrapper } from '@tiptap/react'
import { useEffect, useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'

const LANGUAGES = ['python', 'javascript', 'typescript', 'java', 'sql', 'css', 'html', 'bash', 'go', 'rust', 'text']

export default function CodeBlockView({ node, updateAttributes, editor }) {
  const language = node.attrs.language || 'text'
  const editable = !!editor?.isEditable
  const [copied, setCopied] = useState(false)
  const timer = useRef(0)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  async function copyCode() {
    const code = node.textContent || ''
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      /* ignore */
    }
    setCopied(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <NodeViewWrapper className={`note-code-view ${editable ? 'is-edit' : ''}`}>
      <figure className="note-code">
        <div className="note-code-chrome" contentEditable={false}>
          <span className="note-code-dots" aria-hidden="true">
            <i className="is-close" />
            <i className="is-min" />
            <i className="is-max" />
          </span>
          {editable ? (
            <label className="note-code-lang-wrap">
              <span className="sr-only">Linguagem</span>
              <select
                className="note-code-lang-select"
                value={language}
                onChange={(event) => updateAttributes({ language: event.target.value })}
              >
                {LANGUAGES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <span className="note-code-lang">{language}</span>
          )}
          {editable ? (
            <span />
          ) : (
            <button
              className={`note-code-copy ${copied ? 'is-on' : ''}`}
              type="button"
              onClick={copyCode}
              aria-label={copied ? 'Código copiado' : 'Copiar código'}
            >
              {copied ? <Check size={14} strokeWidth={2.4} /> : <Copy size={14} strokeWidth={2.2} />}
            </button>
          )}
        </div>
        <pre className="note-code-body">
          <NodeViewContent as="code" />
        </pre>
      </figure>
    </NodeViewWrapper>
  )
}
