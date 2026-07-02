import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '../ui/Card'
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
      <Card className="recent-activity">
        <Spinner label="Cargando actividad…" />
      </Card>
    )
  }

  if (tasks.length === 0) {
    return (
      <Card className="recent-activity">
        <div className="empty-state">
          <span className="empty-state-icon">
            <Inbox size={24} strokeWidth={1.5} />
          </span>
          <strong>Sin actividad reciente</strong>
          <p>¡Ejecuta tu primera receta desde el Dashboard para ver tus campañas aquí!</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="recent-activity">
      <span className="recent-icon">
        <Activity size={20} strokeWidth={1.75} />
      </span>
      <div className="stack" style={{ gap: '0.5rem', width: '100%' }}>
        <h3 style={{ margin: 0 }}>Actividad reciente</h3>
        {tasks.map((task) => (
          <Link
            to={`/preview/${task.id}`}
            key={task.id}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)',
              textDecoration: 'none', color: 'inherit',
            }}
          >
            <span style={{ textTransform: 'capitalize', fontSize: '0.9rem' }}>{task.recipe_type}</span>
            <TaskStatusBadge status={task.status} />
          </Link>
        ))}
      </div>
    </Card>
  )
}

