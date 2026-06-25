import { TaskList } from '../components/history/TaskList'

export function History() {
  return (
    <section className="page stack">
      <div>
        <h1>Historial</h1>
        <p>Campañas generadas y estado de ejecución.</p>
      </div>
      <div className="pending-backend-banner">
        <span>⏳</span>
        <div>
          <strong>Pendiente de backend</strong>
          <p>Esta página consume <code>GET /api/tasks</code>. Coordinar contrato con Omar/Saúl.</p>
        </div>
      </div>
      <TaskList />
    </section>
  )
}
