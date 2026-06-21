import { TaskList } from '../components/history/TaskList'

export function History() {
  return (
    <section className="page stack">
      <div>
        <h1>Historial</h1>
        <p>Campanas generadas y estado de ejecucion.</p>
      </div>
      <TaskList />
    </section>
  )
}
