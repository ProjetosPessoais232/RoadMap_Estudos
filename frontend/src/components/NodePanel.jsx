import { useEffect, useState } from 'react'
import {
  createCourse,
  createNode,
  deleteCourse,
  deleteNode,
  listCourses,
  updateNode,
  updateNodeStatus,
} from '../api'

const STATUS_LABEL = {
  NOT_STARTED: 'Não iniciado',
  IN_PROGRESS: 'Em progresso',
  COMPLETED: 'Concluído',
}

const emptyCourse = { name: '', platform: '', url: '' }

const inputClass =
  'w-full border-0 border-b border-hairline bg-transparent px-0 py-2 text-[14px] text-ink-primary outline-none placeholder:text-ink-tertiary focus:border-copper'
const labelClass = 'font-mono text-[11px] uppercase tracking-[0.08em] text-ink-tertiary'

export default function NodePanel({ node, onChanged, onDeleted, onError }) {
  const [title, setTitle] = useState(node.title)
  const [courses, setCourses] = useState([])
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [courseForm, setCourseForm] = useState(emptyCourse)
  const [childId, setChildId] = useState('')
  const [childTitle, setChildTitle] = useState('')

  useEffect(() => {
    setTitle(node.title)
    setChildId('')
    setChildTitle('')
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

  async function addChild(event) {
    event.preventDefault()
    try {
      const created = await createNode({
        id: childId.trim().toLowerCase(),
        title: childTitle.trim(),
        parentId: node.id,
        posX: (node.posX ?? 0) + 240,
        posY: (node.posY ?? 0) + 80,
      })
      setChildId('')
      setChildTitle('')
      onChanged(created, true)
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
    <aside className="flex h-full w-[360px] shrink-0 flex-col overflow-y-auto border-l border-hairline bg-surface px-5 py-6">
      <p className={labelClass}>Nó</p>
      <h2 className="mt-2 font-display text-[22px] font-normal leading-tight text-ink-primary">{node.title}</h2>
      <p className="mt-1 font-mono text-[11px] tracking-wide text-ink-tertiary">{node.id}</p>

      <form className="mt-8 space-y-3" onSubmit={saveTitle}>
        <label className={labelClass}>Título</label>
        <input className={inputClass} value={title} onChange={(event) => setTitle(event.target.value)} />
        <button
          className="text-[13px] text-ink-secondary underline-offset-4 transition-colors duration-150 hover:text-copper hover:underline"
          type="submit"
        >
          Salvar título
        </button>
      </form>

      <p className={`${labelClass} mt-8`}>Progresso</p>
      <div className="mt-3 space-y-2">
        {Object.entries(STATUS_LABEL).map(([value, label]) => {
          const active = node.status === value
          return (
            <button
              key={value}
              type="button"
              className={`flex w-full items-center gap-2.5 text-left text-[14px] transition-colors duration-150 ${
                active ? 'text-ink-primary' : 'text-ink-tertiary hover:text-ink-secondary'
              }`}
              onClick={() => changeStatus(value)}
            >
              <StatusMark status={value} active={active} />
              {label}
            </button>
          )
        })}
      </div>

      <section className="mt-8">
        <h3 className={labelClass}>Cursos</h3>
        {loadingCourses && <p className="mt-3 text-[12px] text-ink-tertiary">Carregando cursos…</p>}
        {!loadingCourses && courses.length === 0 && (
          <p className="empty-fade mt-3 text-[13px] leading-relaxed text-ink-secondary">Nenhum curso neste nó ainda.</p>
        )}
        <ul className="mt-4 space-y-4">
          {courses.map((course) => (
            <li key={course.id} className="border-l border-hairline pl-3">
              <p className="text-[14px] text-ink-primary">{course.name}</p>
              <p className="font-mono text-[11px] tracking-wide text-ink-tertiary">{course.platform}</p>
              <a
                className="text-[12px] text-ink-secondary underline-offset-4 hover:text-copper hover:underline"
                href={course.url}
                target="_blank"
                rel="noreferrer"
              >
                abrir
              </a>
              <button
                className="ml-3 text-[12px] text-danger/80 hover:text-danger"
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
          <button
            className="text-[13px] text-ink-secondary underline-offset-4 hover:text-copper hover:underline"
            type="submit"
          >
            Adicionar curso
          </button>
        </form>
      </section>

      <section className="mt-8">
        <h3 className={labelClass}>Filhos</h3>
        <form className="mt-3 ml-3 space-y-3 border-l border-hairline pl-3" onSubmit={addChild}>
          <input
            className={`${inputClass} font-mono text-[13px]`}
            placeholder="id slug (ex: redis)"
            value={childId}
            onChange={(event) => setChildId(event.target.value)}
          />
          <input
            className={`${inputClass} font-mono text-[13px]`}
            placeholder="Título"
            value={childTitle}
            onChange={(event) => setChildTitle(event.target.value)}
          />
          <button
            className="font-mono text-[12px] text-ink-secondary underline-offset-4 hover:text-copper hover:underline"
            type="submit"
          >
            Criar filho
          </button>
        </form>
      </section>

      <button
        className="mt-auto pt-8 text-left text-[13px] text-danger/80 hover:text-danger"
        type="button"
        onClick={removeNode}
      >
        Remover nó
      </button>
    </aside>
  )
}

function StatusMark({ status, active }) {
  if (status === 'IN_PROGRESS') {
    return (
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full ${active ? 'bg-copper' : 'bg-ink-tertiary/40'}`}
        aria-hidden="true"
      />
    )
  }
  if (status === 'COMPLETED') {
    return (
      <span
        className={`inline-block h-1.5 w-1.5 ${active ? 'bg-status-done' : 'bg-ink-tertiary/40'}`}
        aria-hidden="true"
      />
    )
  }
  return (
    <span
      className={`inline-block h-1.5 w-1.5 rounded-full border ${
        active ? 'border-ink-secondary' : 'border-ink-tertiary/50'
      }`}
      aria-hidden="true"
    />
  )
}
