import { Link } from 'react-router-dom'
import { useTasks } from '../../hooks/useTasks'
import { Card } from '../ui/Card'
import { Spinner } from '../ui/Spinner'
import { TaskStatusBadge } from './TaskStatusBadge'

export function TaskList() {
  const { tasks, loading, error } = useTasks()

  if (loading) {
    return <Spinner />
  }

  if (error) {
    return <p className="csv-error">⚠ {error}</p>
  }

  if (tasks.length === 0) {
    return <p>No hay campañas todavía.</p>
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

