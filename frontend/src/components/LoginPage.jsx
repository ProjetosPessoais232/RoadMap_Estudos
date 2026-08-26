import { useState } from 'react'
import { login, register, setSession } from '../api'
import AppLogo from './AppLogo.jsx'

export default function LoginPage({ onAuthenticated, onBack, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode)
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
    <div className="auth-screen-enter grid min-h-screen bg-void lg:grid-cols-2">
      <aside className="auth-aside-enter relative hidden overflow-hidden border-r-2 border-node-border bg-surface-raised lg:flex lg:flex-col lg:items-center lg:justify-center" aria-hidden="true">
        <div className="logo-float">
          <AppLogo size="xl" showText={false} />
        </div>
        <p className="empty-fade mt-6 font-display text-2xl font-semibold text-ink-primary">Paperless</p>
        <p className="empty-fade empty-fade-2 mt-2 max-w-xs text-center text-[14px] text-ink-secondary">Seu roadmap de aprendizado com mentor de IA</p>
      </aside>

      <section className="flex items-center justify-center bg-void px-6 py-16 sm:px-10">
        <form onSubmit={submit} className="auth-form-enter w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <AppLogo size="lg" textClassName="text-[20px]" />
          </div>
          <h1 key={mode} className="auth-title-swap font-display text-[34px] font-semibold tracking-tight text-ink-primary">
            {mode === 'login' ? 'Entrar' : 'Criar conta'}
          </h1>
          <p className="empty-fade mt-3 text-[15px] leading-[1.65] text-ink-secondary">
            Progresso, cursos e histórico da IA ficam vinculados ao seu usuário.
          </p>

          {error && (
            <p className="error-enter mt-6 border border-danger/35 bg-surface px-3 py-2 text-sm text-danger">{error}</p>
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
            className="mt-2 w-full rounded-lg border-2 border-node-border bg-white px-3 py-2 text-[15px] font-medium text-ink-primary outline-none placeholder:text-ink-tertiary"
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
            className="mt-2 w-full rounded-lg border-2 border-node-border bg-white px-3 py-2 text-[15px] font-medium text-ink-primary outline-none placeholder:text-ink-tertiary"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          <button
            className="btn-ink mt-10 w-full rounded-lg bg-black py-2.5 text-[13px] font-semibold text-white hover:opacity-90 disabled:opacity-50"
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
          {onBack ? (
            <button
              className="mt-3 w-full text-left text-[13px] font-medium text-ink-tertiary hover:text-ink-primary"
              type="button"
              onClick={onBack}
            >
              Voltar à página inicial
            </button>
          ) : null}

          <p className="mt-16 font-mono text-[11px] font-medium tracking-[0.06em] text-ink-tertiary">
            paperless learning
          </p>
        </form>
      </section>
    </div>
  )
}
