import { TaskList } from '../components/history/TaskList'

export function History() {
  return (
    <section className="page stack">
      <div>
        <h1>Historial</h1>
        <p>Campañas generadas y estado de ejecución.</p>
      </div>
      <TaskList />
    </section>
  )
}

