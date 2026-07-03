import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart3,
  CalendarClock,
  CheckCircle2,
  Clock3,
  DollarSign,
  Inbox,
  Mail,
  Megaphone,
  Sparkles,
  Users,
} from 'lucide-react'
import { getTasks, parseApiError } from '../lib/api'
import { supabase } from '../lib/supabase'
import type { Task, TaskStatus } from '../types'
import { Spinner } from '../components/ui/Spinner'
import { TaskStatusBadge } from '../components/history/TaskStatusBadge'

type HistoryFilter = 'all' | 'tasks' | 'studio' | 'pending' | 'completed'

interface StudioCampaignRow {
  id: string
  name: string
  prompt: string
  created_at: string
  content_by_channel?: Record<string, unknown> | null
}

interface HistoryAction {
  id: string
  kind: 'task' | 'studio'
  title: string
  description: string
  createdAt: string
  costUsd: number
  statusLabel: string
  taskStatus?: TaskStatus
  score?: number | null
  recipients?: number
  channels?: number
  href: string
}

const FILTERS: Array<{ id: HistoryFilter; label: string }> = [
  { id: 'all', label: 'Todo' },
  { id: 'tasks', label: 'Recetas' },
  { id: 'studio', label: 'Estudio' },
  { id: 'pending', label: 'Pendientes' },
  { id: 'completed', label: 'Completadas' },
]

const RECIPE_LABELS: Record<string, string> = {
  reactivacion: 'Reactivación de clientes',
  bienvenida: 'Bienvenida',
  postventa: 'Postventa',
  lanzamiento: 'Lanzamiento',
  propuesta: 'Propuesta express',
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function statusText(status: TaskStatus) {
  const labels: Record<TaskStatus, string> = {
    CREATED: 'Creada',
    PROCESSING: 'Procesando',
    PENDING_APPROVAL: 'Revisión pendiente',
    APPROVED: 'Aprobada',
    EXECUTING: 'Enviando',
    COMPLETED: 'Completada',
    FAILED: 'Fallida',
  }
  return labels[status]
}

function taskToAction(task: Task): HistoryAction {
  const title = RECIPE_LABELS[task.recipe_type] ?? task.recipe_type
  const params = task.params ?? {}
  const description =
    typeof params.prompt === 'string'
      ? params.prompt
      : task.draft_content?.asunto ?? 'Receta generada con IA y lista para revisión.'

  return {
    id: task.id,
    kind: 'task',
    title,
    description,
    createdAt: task.created_at,
    costUsd: task.cost_usd,
    statusLabel: statusText(task.status),
    taskStatus: task.status,
    score: task.agent_score,
    recipients: task.recipients?.length ?? 0,
    href: `/preview/${task.id}`,
  }
}

function studioToAction(row: StudioCampaignRow): HistoryAction {
  return {
    id: row.id,
    kind: 'studio',
    title: row.name,
    description: row.prompt,
    createdAt: row.created_at,
    costUsd: 0,
    statusLabel: 'Generada en Estudio',
    channels: Object.keys(row.content_by_channel ?? {}).length,
    href: '/studio',
  }
}

export function History() {
  const [actions, setActions] = useState<HistoryAction[]>([])
  const [filter, setFilter] = useState<HistoryFilter>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadHistory() {
      setLoading(true)
      setError(null)

      try {
        const tasks = await getTasks(50)
        const { data: userData } = await supabase.auth.getUser()
        const userId = userData.user?.id
        let studioRows: StudioCampaignRow[] = []

        if (userId) {
          const { data, error: studioError } = await supabase
            .from('studio_campaigns')
            .select('id,name,prompt,created_at,content_by_channel')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

          if (studioError) {
            throw new Error('No se pudo leer el historial de Estudio.')
          }

          studioRows = (data ?? []) as StudioCampaignRow[]
        }

        if (cancelled) return

        const nextActions = [
          ...tasks.map(taskToAction),
          ...studioRows.map(studioToAction),
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

        setActions(nextActions)
      } catch (err) {
        if (!cancelled) setError(parseApiError(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadHistory()
    return () => {
      cancelled = true
    }
  }, [])

  const summary = useMemo(() => {
    const completed = actions.filter((action) => action.taskStatus === 'COMPLETED').length
    const pending = actions.filter((action) => action.taskStatus === 'PENDING_APPROVAL').length
    const studio = actions.filter((action) => action.kind === 'studio').length
    const cost = actions.reduce((sum, action) => sum + action.costUsd, 0)
    return { completed, pending, studio, cost }
  }, [actions])

  const filteredActions = actions.filter((action) => {
    if (filter === 'tasks') return action.kind === 'task'
    if (filter === 'studio') return action.kind === 'studio'
    if (filter === 'pending') return action.taskStatus === 'PENDING_APPROVAL'
    if (filter === 'completed') return action.taskStatus === 'COMPLETED'
    return true
  })

  if (loading) {
    return (
      <section className="page history-page">
        <Spinner label="Cargando historial..." />
      </section>
    )
  }

  return (
    <section className="page history-page">
      <header className="history-hero">
        <div>
          <span className="dashboard-eyebrow">Actividad</span>
          <h1>Historial</h1>
          <p>Acciones ejecutadas, campañas generadas y estado operativo de tu cuenta.</p>
        </div>
        <div className="history-hero-badge">
          <CalendarClock size={18} />
          <span>{actions.length} acciones</span>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <section className="history-summary-grid">
        <article>
          <span><CheckCircle2 size={18} /></span>
          <small>Completadas</small>
          <strong>{summary.completed}</strong>
        </article>
        <article>
          <span><Clock3 size={18} /></span>
          <small>Pendientes</small>
          <strong>{summary.pending}</strong>
        </article>
        <article>
          <span><Sparkles size={18} /></span>
          <small>Estudio</small>
          <strong>{summary.studio}</strong>
        </article>
        <article>
          <span><DollarSign size={18} /></span>
          <small>Costo total</small>
          <strong>${summary.cost.toFixed(5)}</strong>
        </article>
      </section>

      <div className="history-toolbar">
        <div className="history-tabs">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={filter === item.id ? 'is-active' : ''}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {filteredActions.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">
            <Inbox size={24} strokeWidth={1.5} />
          </span>
          <strong>No hay acciones para este filtro</strong>
          <p>Genera una campaña desde Estudio o ejecuta una receta para alimentar el historial.</p>
          <Link to="/dashboard">Ir al Dashboard</Link>
        </div>
      ) : (
        <div className="history-actions">
          {filteredActions.map((action) => (
            <Link to={action.href} className="history-action-card" key={`${action.kind}-${action.id}`}>
              <span className={`history-action-icon history-action-icon-${action.kind}`}>
                {action.kind === 'studio' ? <Megaphone size={20} /> : <Mail size={20} />}
              </span>

              <div className="history-action-main">
                <div className="history-action-title-row">
                  <div>
                    <small>{action.kind === 'studio' ? 'Campaña multicanal' : 'Receta automatizada'}</small>
                    <h2>{action.title}</h2>
                  </div>
                  {action.taskStatus ? (
                    <TaskStatusBadge status={action.taskStatus} />
                  ) : (
                    <span className="history-studio-badge">{action.statusLabel}</span>
                  )}
                </div>

                <p>{action.description}</p>

                <div className="history-action-meta">
                  <span><CalendarClock size={14} /> {formatDate(action.createdAt)}</span>
                  <span><DollarSign size={14} /> ${action.costUsd.toFixed(5)}</span>
                  {typeof action.score === 'number' && <span><BarChart3 size={14} /> Score {action.score}/10</span>}
                  {typeof action.recipients === 'number' && <span><Users size={14} /> {action.recipients} destinatarios</span>}
                  {typeof action.channels === 'number' && <span><Sparkles size={14} /> {action.channels || 5} canales</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
