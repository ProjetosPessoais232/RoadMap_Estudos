import { useState } from 'react'
import { login, register, setSession } from '../api'

export default function LoginPage({ onAuthenticated }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const action = mode === 'login' ? login : register
      const session = await action(email.trim(), password)
      setSession(session.token, session.email)
      onAuthenticated(session)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-screen bg-void lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden border-r border-hairline bg-surface-raised lg:block" aria-hidden="true">
        <MapFragment />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_42%,var(--color-void)_82%)]" />
        <p className="absolute bottom-8 left-10 font-display text-2xl font-semibold text-ink-tertiary">
          LMS de Estudos
        </p>
      </aside>

      <section className="flex items-center justify-center bg-void px-6 py-16 sm:px-10">
        <form onSubmit={submit} className="empty-fade w-full max-w-sm">
          <h1 className="font-display text-[34px] font-semibold tracking-tight text-ink-primary">
            {mode === 'login' ? 'Entrar' : 'Criar conta'}
          </h1>
          <p className="mt-3 text-[15px] leading-[1.65] text-ink-secondary">
            Progresso, cursos e histórico da IA ficam vinculados ao seu usuário.
          </p>

          {error && (
            <p className="mt-6 border border-danger/35 bg-surface px-3 py-2 text-sm text-danger">{error}</p>
          )}

          <label
            className="mt-10 block font-sans text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-tertiary"
            htmlFor="email"
          >
            E-mail
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            className="mt-2 w-full border-0 border-b border-hairline bg-transparent px-0 py-2 text-[15px] font-medium text-ink-primary outline-none placeholder:text-ink-tertiary"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <label
            className="mt-6 block font-sans text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-tertiary"
            htmlFor="password"
          >
            Senha (mín. 6)
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            className="mt-2 w-full border-0 border-b border-hairline bg-transparent px-0 py-2 text-[15px] font-medium text-ink-primary outline-none placeholder:text-ink-tertiary"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          <button
            className="mt-10 w-full bg-accent py-2.5 text-[13px] font-semibold text-white hover:opacity-90 disabled:opacity-50"
            disabled={loading}
            type="submit"
          >
            {loading ? 'Aguarde…' : mode === 'login' ? 'Entrar' : 'Cadastrar'}
          </button>

          <button
            className="mt-4 w-full text-left text-[13px] font-medium text-ink-secondary hover:text-ink-primary"
            type="button"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          >
            {mode === 'login' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entrar'}
          </button>

          <p className="mt-16 font-mono text-[11px] font-medium tracking-[0.06em] text-ink-tertiary">
            observatório de aprendizado
          </p>
        </form>
      </section>
    </div>
  )
}

function MapFragment() {
  const nodes = [
    { x: 18, y: 22, role: 'main', w: 128 },
    { x: 42, y: 34, role: 'option', w: 110 },
    { x: 58, y: 34, role: 'option', w: 110 },
    { x: 42, y: 48, role: 'option', w: 110 },
    { x: 58, y: 48, role: 'option', w: 110 },
    { x: 28, y: 68, role: 'main', w: 132 },
    { x: 52, y: 78, role: 'option', w: 118 },
  ]

  return (
    <div className="absolute inset-0 origin-center scale-110 blur-[6px]">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <line x1="24" y1="14" x2="24" y2="24" className="stroke-ink-tertiary" strokeWidth="0.12" strokeDasharray="0.6 0.7" />
        <line x1="24" y1="24" x2="48" y2="36" className="stroke-hairline" strokeWidth="0.14" strokeDasharray="0.5 0.7" />
        <line x1="24" y1="24" x2="64" y2="36" className="stroke-hairline" strokeWidth="0.14" strokeDasharray="0.5 0.7" />
        <line x1="24" y1="24" x2="48" y2="50" className="stroke-hairline" strokeWidth="0.14" strokeDasharray="0.5 0.7" />
        <line x1="34" y1="70" x2="58" y2="80" className="stroke-hairline" strokeWidth="0.14" strokeDasharray="0.5 0.7" />
        <line x1="24" y1="24" x2="34" y2="70" className="stroke-hairline-strong" strokeWidth="0.18" />
      </svg>
      {nodes.map((node) => (
        <div
          key={`${node.x}-${node.y}`}
          className={
            node.role === 'main'
              ? 'absolute h-9 border-[1.5px] border-accent bg-accent-dim'
              : 'absolute h-9 border border-hairline bg-surface'
          }
          style={{ left: `${node.x}%`, top: `${node.y}%`, width: node.w }}
        />
      ))}
    </div>
  )
}
