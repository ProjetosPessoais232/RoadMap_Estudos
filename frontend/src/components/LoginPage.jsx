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
      <aside className="relative hidden overflow-hidden lg:block" aria-hidden="true">
        <MapFragment />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,var(--color-void)_78%)]" />
        <p className="absolute bottom-8 left-10 font-display text-2xl italic text-ink-tertiary">
          LMS de Estudos
        </p>
      </aside>

      <section className="flex items-center justify-center px-6 py-16 sm:px-10">
        <form onSubmit={submit} className="empty-fade w-full max-w-sm">
          <h1 className="font-display text-[34px] font-normal tracking-tight text-ink-primary">
            {mode === 'login' ? 'Entrar' : 'Criar conta'}
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-secondary">
            Progresso, cursos e histórico da IA ficam vinculados ao seu usuário.
          </p>

          {error && (
            <p className="mt-6 border border-danger/40 px-3 py-2 text-sm text-danger">{error}</p>
          )}

          <label
            className="mt-10 block font-mono text-[11px] uppercase tracking-[0.08em] text-ink-tertiary"
            htmlFor="email"
          >
            E-mail
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            className="mt-2 w-full border-0 border-b border-hairline bg-transparent px-0 py-2 text-[15px] text-ink-primary outline-none transition-colors duration-150 placeholder:text-ink-tertiary focus:border-copper"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <label
            className="mt-6 block font-mono text-[11px] uppercase tracking-[0.08em] text-ink-tertiary"
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
            className="mt-2 w-full border-0 border-b border-hairline bg-transparent px-0 py-2 text-[15px] text-ink-primary outline-none transition-colors duration-150 placeholder:text-ink-tertiary focus:border-copper"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          <button
            className="mt-10 w-full bg-copper py-2.5 text-[13px] font-medium text-void transition-opacity duration-150 ease-out hover:opacity-90 disabled:opacity-50"
            disabled={loading}
            type="submit"
          >
            {loading ? 'Aguarde…' : mode === 'login' ? 'Entrar' : 'Cadastrar'}
          </button>

          <button
            className="mt-4 w-full text-left text-[13px] text-ink-secondary transition-colors duration-150 hover:text-ink-primary"
            type="button"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          >
            {mode === 'login' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entrar'}
          </button>

          <p className="mt-16 font-mono text-[11px] tracking-[0.08em] text-ink-tertiary">
            observatório de aprendizado
          </p>
        </form>
      </section>
    </div>
  )
}

function MapFragment() {
  const nodes = [
    { x: 18, y: 22, state: 'idle', w: 118 },
    { x: 42, y: 38, state: 'done', w: 132 },
    { x: 28, y: 58, state: 'done', w: 146 },
    { x: 58, y: 52, state: 'idle', w: 110 },
    { x: 48, y: 74, state: 'done', w: 124 },
    { x: 16, y: 78, state: 'idle', w: 96 },
  ]

  return (
    <div className="absolute inset-0 origin-center scale-110 blur-[6px]">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <line x1="24" y1="24" x2="48" y2="40" className="stroke-hairline" strokeWidth="0.12" />
        <line x1="48" y1="40" x2="36" y2="60" className="stroke-hairline" strokeWidth="0.12" />
        <line x1="36" y1="60" x2="64" y2="54" className="stroke-hairline" strokeWidth="0.12" />
        <line x1="36" y1="60" x2="54" y2="76" className="stroke-hairline" strokeWidth="0.12" />
        <line x1="36" y1="60" x2="22" y2="80" className="stroke-hairline" strokeWidth="0.12" />
      </svg>
      {nodes.map((node) => (
        <div
          key={`${node.x}-${node.y}`}
          className={
            node.state === 'done'
              ? 'absolute h-10 border border-status-done bg-surface-raised'
              : 'absolute h-10 border border-hairline bg-transparent'
          }
          style={{ left: `${node.x}%`, top: `${node.y}%`, width: node.w }}
        />
      ))}
    </div>
  )
}
