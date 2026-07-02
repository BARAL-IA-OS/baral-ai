import { Link } from 'react-router-dom'
import { Inbox } from 'lucide-react'
import { useTasks } from '../../hooks/useTasks'
import { Card } from '../ui/Card'
import { Spinner } from '../ui/Spinner'
import { TaskStatusBadge } from './TaskStatusBadge'

export function TaskList() {
  const { tasks, loading, error } = useTasks()

  if (loading) {
    return <Spinner label="Cargando historial…" />
  }

  if (error) {
    return <div className="error-banner">⚠ {error}</div>
  }

  if (tasks.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-state-icon">
          <Inbox size={24} strokeWidth={1.5} />
        </span>
        <strong>No hay campañas todavía</strong>
        <p>Ejecuta tu primera receta para ver el historial de campañas generadas por la IA.</p>
        <Link to="/dashboard">Ir al Dashboard →</Link>
      </div>
    )
  }

  return (
    <section className="stack">
      {tasks.map((task) => (
        <Link to={`/preview/${task.id}`} key={task.id} style={{ textDecoration: 'none', color: 'inherit' }}>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, textTransform: 'capitalize' }}>{task.recipe_type}</h3>
              <TaskStatusBadge status={task.status} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', opacity: 0.7, marginTop: '0.25rem' }}>
              <span>Costo: ${task.cost_usd.toFixed(5)}</span>
              <span>{new Date(task.created_at).toLocaleDateString()}</span>
            </div>
          </Card>
        </Link>
      ))}
    </section>
  )
}


