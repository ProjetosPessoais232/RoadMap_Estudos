export default function ChatMessage({ role, content, children }) {
  const assistant = role === 'assistant'

  return (
    <article className={`chat-message-enter flex flex-col ${assistant ? 'mr-auto max-w-[85%] items-start' : 'ml-auto max-w-[85%] items-end'}`}>
      {assistant ? (
        <div className="mb-1.5 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-node-border bg-node-main text-[9px] font-bold">IA</span>
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink-tertiary">Mentor</span>
        </div>
      ) : null}
      <p className={`whitespace-pre-wrap rounded-2xl border-2 border-node-border px-4 py-3 text-[15px] leading-[1.65] ${assistant ? 'bg-white text-ink-secondary' : 'bg-node-main font-medium text-ink-primary'}`}>
        {content}
      </p>
      {children ? <div className="mt-3 w-full space-y-3">{children}</div> : null}
    </article>
  )
}

export function TypingMessage() {
  return (
    <div className="chat-message-enter mr-auto flex max-w-[85%] flex-col items-start">
      <div className="mb-1.5 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-node-border bg-node-main text-[9px] font-bold">IA</span>
        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink-tertiary">Mentor</span>
      </div>
      <div className="flex items-center gap-2 rounded-2xl border-2 border-node-border bg-white px-4 py-3 text-[14px] text-ink-secondary">
        IA digitando...
        <span className="typing-dots" aria-label="Carregando"><i /><i /><i /></span>
      </div>
    </div>
  )
}
