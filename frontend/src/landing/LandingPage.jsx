import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import AppLogo from '../components/AppLogo.jsx'
import HeroGraph from './HeroGraph.jsx'
import MagneticButton from './MagneticButton.jsx'
import Preloader from './Preloader.jsx'
import { prefersReducedMotion, useSmoothScroll } from './useSmoothScroll.js'
import './landing.css'

gsap.registerPlugin(ScrollTrigger)

const STEPS = [
  {
    title: 'Escolha o caminho',
    body: 'Monte a trilha de tecnologias como um mapa — não como uma lista infinita de links.',
    highlight: 'java',
  },
  {
    title: 'Marque o progresso',
    body: 'Cinza, em andamento ou concluído. O roadmap mostra o que você já sabe.',
    highlight: 'spring',
  },
  {
    title: 'Peça um curso ao mentor',
    body: 'Descreva o que quer estudar. A IA discute plataformas e devolve opções reais.',
    highlight: 'sql',
  },
  {
    title: 'Salve no nó certo',
    body: 'O curso entra no card do Java, do React, do Postgres — exatamente onde você vai usar.',
    highlight: 'goal',
  },
]

const HOW = [
  { n: '01', t: 'Crie conta', d: 'E-mail e senha. Progresso e histórico ficam só seus.' },
  { n: '02', t: 'Monte o roadmap', d: 'Importe uma amostra ou crie nós do zero.' },
  { n: '03', t: 'Converse com o mentor', d: 'Peça Java na Udemy, React grátis, o que for.' },
  { n: '04', t: 'Salve e estude', d: 'O curso vai para o nó certo. Siga o mapa.' },
]

const WORDS = ['Seu', 'roadmap.', 'Sem', 'papel.', 'Com', 'um', 'mentor.']

export default function LandingPage({ onStart, onLogin }) {
  const reduced = prefersReducedMotion()
  const [booting, setBooting] = useState(() => {
    if (reduced) return false
    return sessionStorage.getItem('paperless_seen') !== '1'
  })
  const [scrolled, setScrolled] = useState(false)
  const [step, setStep] = useState(0)
  const [typed, setTyped] = useState(false)
  const pinRef = useRef(null)
  const lineRef = useRef(null)
  const howRef = useRef(null)
  const barRef = useRef(null)
  useSmoothScroll(!booting && !reduced)

  useEffect(() => {
    document.documentElement.classList.add('landing-active')
    return () => document.documentElement.classList.remove('landing-active')
  }, [])

  useEffect(() => {
    if (!booting) sessionStorage.setItem('paperless_seen', '1')
    if (!booting) return undefined
    const timer = window.setTimeout(() => setBooting(false), 1100)
    return () => window.clearTimeout(timer)
  }, [booting])

  useEffect(() => {
    function onScroll() {
      const y = window.scrollY
      setScrolled(y > 24)
      if (barRef.current) {
        const max = document.documentElement.scrollHeight - window.innerHeight
        barRef.current.style.width = `${max > 0 ? (y / max) * 100 : 0}%`
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [booting])

  useEffect(() => {
    if (booting || reduced) return undefined
    const triggers = []
    if (pinRef.current && window.innerWidth >= 900) {
      triggers.push(
        ScrollTrigger.create({
          trigger: pinRef.current,
          start: 'top top',
          end: '+=160%',
          pin: true,
          scrub: true,
          onUpdate: (self) => {
            const index = Math.min(3, Math.floor(self.progress * 4))
            setStep(index)
            const fill = pinRef.current.querySelector('.landing-progress span')
            if (fill) fill.style.transform = `scaleY(${0.25 + self.progress * 0.75})`
          },
        }),
      )
    }
    if (howRef.current && lineRef.current) {
      triggers.push(
        gsap.to(lineRef.current, {
          height: '92%',
          ease: 'none',
          scrollTrigger: {
            trigger: howRef.current,
            start: 'top 70%',
            end: 'bottom 55%',
            scrub: true,
            onUpdate: (self) => {
              howRef.current.querySelectorAll('.landing-step').forEach((node, index) => {
                node.classList.toggle('is-on', self.progress > index / 4 + 0.04)
              })
            },
          },
        }).scrollTrigger,
      )
    }
    return () => {
      triggers.forEach((trigger) => trigger?.kill())
    }
  }, [booting, reduced])

  useEffect(() => {
    if (booting) return undefined
    const timer = window.setTimeout(() => setTyped(true), 900)
    return () => window.clearTimeout(timer)
  }, [booting])

  function scrollTo(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' })
  }

  return (
    <div className={`landing-root ${reduced ? 'reduced' : ''}`}>
      <div ref={barRef} className="landing-progress-top" />

      <AnimatePresence>
        {booting ? <Preloader key="preloader" /> : null}
      </AnimatePresence>

      <header className={`landing-header ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="landing-header-pill">
          <AppLogo size="sm" textClassName="text-[16px]" />
          <nav className="landing-nav">
            <a href="#produto" onClick={(event) => { event.preventDefault(); scrollTo('produto') }}>Produto</a>
            <a href="#mentor" onClick={(event) => { event.preventDefault(); scrollTo('mentor') }}>Mentor</a>
            <a href="#como" onClick={(event) => { event.preventDefault(); scrollTo('como') }}>Como funciona</a>
          </nav>
          <MagneticButton className="landing-btn-dark" onClick={onLogin}>
            Entrar
          </MagneticButton>
        </div>
      </header>

      <section className="landing-hero" id="produto">
        <h1>
          {WORDS.map((word, index) => (
            <motion.span
              key={`${word}-${index}`}
              initial={reduced ? false : { y: 20, opacity: 0, filter: 'blur(6px)' }}
              animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
              transition={{ delay: 0.15 + index * 0.06, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              {word}&nbsp;
            </motion.span>
          ))}
        </h1>
        <motion.p
          className="landing-hero-copy"
          initial={reduced ? false : { y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.55, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          Monte a trilha, acompanhe o que já sabe e deixe a IA indicar o próximo curso — no nó certo.
        </motion.p>
        <motion.div
          className="landing-cta-row"
          initial={reduced ? false : { y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.65, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <MagneticButton className="landing-btn-dark" onClick={onStart}>
            Começar agora
          </MagneticButton>
          <button className="landing-btn-ghost" type="button" onClick={() => scrollTo('mapa')}>
            Ver o roadmap
          </button>
        </motion.div>
        <p className="landing-micro">paperless learning</p>
        <HeroGraph highlight="spring" />
      </section>

      <section className="landing-section landing-pin" id="mapa" ref={pinRef}>
        <div className="landing-pin-inner">
          <div className="landing-step-copy">
            <p className="landing-kicker">O mapa em movimento · {step + 1}/4</p>
            <h2>{STEPS[step].title}</h2>
            <p>{STEPS[step].body}</p>
            <div className="landing-progress" aria-hidden="true">
              <span />
            </div>
          </div>
          <HeroGraph highlight={STEPS[step].highlight} dimOthers />
        </div>
      </section>

      <section className="landing-section" id="mentor">
        <div className="landing-chat">
          <div>
            <p className="landing-kicker">Mentor de cursos</p>
            <h2 className="mt-2 font-display text-[36px] font-semibold tracking-tight">Conversa real, curso no nó certo.</h2>
            <div className="mt-8 space-y-3">
              <div className="landing-bubble user">Quero um curso de Java na Udemy para começar do zero.</div>
              <div className="landing-bubble ia">
                {typed
                  ? 'O Java Completo do Nélio Alves é o caminho mais sólido. Relacionei ao nó Java do seu roadmap.'
                  : 'IA digitando…'}
              </div>
            </div>
          </div>
          <div className="landing-course-card">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-tertiary">Udemy</p>
            <p className="mt-2 text-[18px] font-semibold">Java COMPLETO — Programação Orientada a Objetos</p>
            <p className="mt-2 text-[13px] text-ink-secondary">Vinculado a: Java</p>
            <button className="landing-btn-dark mt-5" type="button">
              Salvar no roadmap
            </button>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-benefits">
          <article className="landing-benefit" style={{ animationDelay: '0ms' }}>
            <p className="text-[28px]">◉</p>
            <h3 className="mt-4 font-display text-[22px] font-semibold">Um mapa, não uma lista.</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-secondary">Roadmap visual de tecnologias, com nós conectados como no papel — só que vivo.</p>
          </article>
          <article className="landing-benefit" style={{ animationDelay: '100ms' }}>
            <p className="text-[28px]">✓</p>
            <h3 className="mt-4 font-display text-[22px] font-semibold">Progresso que é só seu.</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-secondary">Status por usuário. Cinza, em andamento, concluído.</p>
          </article>
          <article className="landing-benefit" style={{ animationDelay: '200ms' }}>
            <p className="text-[28px]">↗</p>
            <h3 className="mt-4 font-display text-[22px] font-semibold">Cursos de verdade, salvos no roadmap.</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-secondary">O mentor indica plataformas reais e você grava no nó certo.</p>
          </article>
        </div>
      </section>

      <section className="landing-section" id="como" ref={howRef}>
        <p className="landing-kicker mx-auto mb-10 max-w-[640px]">Como funciona</p>
        <div className="landing-timeline">
          <div ref={lineRef} className="landing-timeline-line" />
          {HOW.map((item) => (
            <div key={item.n} className="landing-step">
              <p className="font-mono text-[12px] text-ink-tertiary">{item.n}</p>
              <h3 className="mt-1 font-display text-[22px] font-semibold">{item.t}</h3>
              <p className="mt-1 text-[15px] text-ink-secondary">{item.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-finale">
        <img src="/logo.png" alt="" className="logo-float mx-auto mb-8 h-16 w-16 object-contain" />
        <h2>Comece o mapa hoje.</h2>
        <p className="mx-auto mt-4 max-w-[36ch] text-[16px] text-ink-secondary">
          Crie sua conta, importe uma amostra e peça o primeiro curso ao mentor.
        </p>
        <MagneticButton className="landing-btn-dark landing-btn-breathe mt-8" onClick={onStart}>
          Começar agora
        </MagneticButton>
      </section>
      <footer className="landing-footer">
        <span>Paperless</span>
        <span>Privacidade</span>
        <span>Contato</span>
      </footer>
    </div>
  )
}
