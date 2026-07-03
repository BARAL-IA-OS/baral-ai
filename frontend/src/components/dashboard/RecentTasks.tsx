import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, Inbox } from 'lucide-react'
import { getTasks } from '../../lib/api'
import { TaskStatusBadge } from '../history/TaskStatusBadge'
import { Spinner } from '../ui/Spinner'
import type { Task } from '../../types'

export function RecentTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getTasks(5)
      .then(setTasks)
      .catch(() => undefined)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <section className="dashboard-panel recent-panel">
        <Spinner label="Cargando actividad..." />
      </section>
    )
  }

  return (
    <section className="dashboard-panel recent-panel">
      <div className="panel-heading">
        <span className="panel-icon"><Activity size={16} /></span>
        <div>
          <span>Historial</span>
          <h2>Actividad reciente</h2>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="panel-empty">
          <span className="empty-state-icon">
            <Inbox size={22} strokeWidth={1.5} />
          </span>
          <strong>Sin actividad reciente</strong>
          <p>Ejecuta tu primera receta para ver tus campañas aquí.</p>
        </div>
      ) : (
        <div className="recent-list">
          {tasks.map((task) => (
            <Link to={`/preview/${task.id}`} key={task.id} className="recent-row">
              <span>
                <strong>{task.recipe_type}</strong>
                <small>Campaña generada</small>
              </span>
              <TaskStatusBadge status={task.status} />
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
