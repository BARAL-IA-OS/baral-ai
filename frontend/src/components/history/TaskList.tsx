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
    return <p>{error}</p>
  }

  if (tasks.length === 0) {
    return <p>No hay campanas todavia.</p>
  }

  return (
    <section className="stack">
      {tasks.map((task) => (
        <Card key={task.id}>
          <h3>{task.recipe_type}</h3>
          <TaskStatusBadge status={task.status} />
          <p>Costo: ${task.cost_usd}</p>
        </Card>
      ))}
    </section>
  )
}
