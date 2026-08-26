import { useEffect, useState } from 'react'
import {
  createCourse,
  deleteCourse,
  deleteNode,
  listCourses,
  updateNode,
  updateNodeStatus,
} from '../api'
import StatusDot, { STATUS_LEGEND } from './StatusDot.jsx'

const emptyCourse = { name: '', platform: '', url: '' }

const inputClass =
  'w-full rounded-lg border-2 border-node-border bg-white px-3 py-2 text-[14px] font-medium text-ink-primary outline-none placeholder:text-ink-tertiary'
const labelClass = 'font-sans text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-tertiary'
const textAction =
  'text-[13px] font-semibold text-ink-secondary underline-offset-4 hover:text-accent hover:underline'

export default function NodePanel({ node, childrenNodes = [], onChanged, onDeleted, onError }) {
  const [title, setTitle] = useState(node.title)
  const [courses, setCourses] = useState([])
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [courseForm, setCourseForm] = useState(emptyCourse)

  useEffect(() => {
    setTitle(node.title)
    setLoadingCourses(true)
    listCourses(node.id)
      .then(setCourses)
      .catch((err) => onError(err.message))
      .finally(() => setLoadingCourses(false))
  }, [node.id, node.title, onError])

  async function saveTitle(event) {
    event.preventDefault()
    try {
      const updated = await updateNode(node.id, {
        title,
        description: node.description,
        parentId: node.parentId,
        posX: node.posX,
        posY: node.posY,
      })
      onChanged(updated)
    } catch (err) {
      onError(err.message)
    }
  }

  async function changeStatus(status) {
    try {
      onChanged(await updateNodeStatus(node.id, status))
    } catch (err) {
      onError(err.message)
    }
  }

  async function removeNode() {
    try {
      await deleteNode(node.id)
      onDeleted(node.id)
    } catch (err) {
      onError(err.message)
    }
  }

  async function addCourse(event) {
    event.preventDefault()
    try {
      const created = await createCourse({ ...courseForm, nodeId: node.id })
      setCourses((current) => [...current, created])
      setCourseForm(emptyCourse)
    } catch (err) {
      onError(err.message)
    }
  }

  async function removeCourse(id) {
    try {
      await deleteCourse(id)
      setCourses((current) => current.filter((course) => course.id !== id))
    } catch (err) {
      onError(err.message)
    }
  }

  return (
    <aside className="node-panel flex h-full w-[360px] flex-col overflow-y-auto bg-surface px-5 py-6">
      <p className={labelClass}>Nó</p>
      <h2 className="mt-2 font-display text-[22px] font-semibold leading-tight text-ink-primary">{node.title}</h2>
      <p className="mt-1 font-mono text-[11px] font-medium tracking-wide text-ink-tertiary">{node.id}</p>

      <form className="mt-8 space-y-3" onSubmit={saveTitle}>
        <label className={labelClass}>Título</label>
        <input className={inputClass} value={title} onChange={(event) => setTitle(event.target.value)} />
        <button className={textAction} type="submit">
          Salvar título
        </button>
      </form>

      <p className={`${labelClass} mt-8`}>Progresso</p>
      <div className="mt-3 space-y-2">
        {STATUS_LEGEND.map((item) => {
          const active = node.status === item.status
          return (
            <button
              key={item.status}
              type="button"
              className={`flex w-full items-center gap-2.5 text-left text-[14px] font-medium ${
                active ? 'rounded-lg border-2 border-node-border bg-node-main px-3 py-2 text-ink-primary' : 'rounded-lg border-2 border-transparent px-3 py-2 text-ink-tertiary hover:border-node-border hover:text-ink-secondary'
              }`}
              onClick={() => changeStatus(item.status)}
            >
              <StatusDot status={item.status} />
              {item.label}
            </button>
          )
        })}
      </div>

      <section className="mt-8">
        <h3 className={labelClass}>Cursos</h3>
        {loadingCourses && <p className="mt-3 text-[12px] text-ink-tertiary">Carregando cursos…</p>}
        {!loadingCourses && courses.length === 0 && (
          <p className="empty-fade mt-3 text-[13px] leading-[1.65] text-ink-secondary">Nenhum curso neste nó ainda.</p>
        )}
        <ul className="mt-4 space-y-4">
          {courses.map((course) => (
            <li key={course.id} className="border-l border-hairline pl-3">
              <p className="text-[14px] font-medium text-ink-primary">{course.name}</p>
              <p className="font-mono text-[11px] font-medium tracking-wide text-ink-tertiary">{course.platform}</p>
              <a
                className="text-[12px] font-medium text-ink-secondary underline-offset-4 hover:text-accent hover:underline"
                href={course.url}
                target="_blank"
                rel="noreferrer"
              >
                abrir
              </a>
              <button
                className="ml-3 text-[12px] font-medium text-danger/80 hover:text-danger"
                type="button"
                onClick={() => removeCourse(course.id)}
              >
                remover
              </button>
            </li>
          ))}
        </ul>
        <form className="mt-5 space-y-3" onSubmit={addCourse}>
          <input
            className={inputClass}
            placeholder="Nome do curso"
            value={courseForm.name}
            onChange={(event) => setCourseForm({ ...courseForm, name: event.target.value })}
          />
          <input
            className={inputClass}
            placeholder="Plataforma (Udemy, Alura…)"
            value={courseForm.platform}
            onChange={(event) => setCourseForm({ ...courseForm, platform: event.target.value })}
          />
          <input
            className={inputClass}
            placeholder="https://…"
            type="url"
            required
            pattern="https?://.+"
            value={courseForm.url}
            onChange={(event) => setCourseForm({ ...courseForm, url: event.target.value })}
          />
          <button className={textAction} type="submit">
            Adicionar curso
          </button>
        </form>
      </section>

      <section className="mt-8">
        <h3 className={labelClass}>Filhos</h3>
        {childrenNodes.length === 0 ? (
          <p className="empty-fade mt-3 text-[13px] leading-[1.65] text-ink-secondary">
            Arraste o pontinho da direita até o mapa vazio para criar um filho.
          </p>
        ) : (
          <ul className="mt-3 ml-3 space-y-1.5 border-l border-hairline pl-3">
            {childrenNodes.map((child) => (
              <li key={child.id} className="font-mono text-[12px] font-medium text-ink-secondary">
                {child.id}
                <span className="text-ink-tertiary"> — {child.title}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <button
        className="mt-auto pt-8 text-left text-[13px] font-medium text-danger/80 hover:text-danger"
        type="button"
        onClick={removeNode}
      >
        Remover nó
      </button>
    </aside>
  )
}
