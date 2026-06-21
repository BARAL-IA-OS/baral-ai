import { ActionCard } from '../components/dashboard/ActionCard'
import { MetricsPanel } from '../components/dashboard/MetricsPanel'
import { RecentTasks } from '../components/dashboard/RecentTasks'

const recipes = [
  ['Reactivar clientes', 'Clientes inactivos segun dias sin compra.', 'reactivacion'],
  ['Bienvenida', 'Primer contacto con propuesta de valor.', 'bienvenida'],
  ['Post-venta', 'Seguimiento despues de una compra.', 'postventa'],
  ['Lanzamiento', 'Email y copy para producto nuevo.', 'lanzamiento'],
  ['Propuesta express', 'Borrador comercial estructurado.', 'propuesta'],
] as const

export function Dashboard() {
  return (
    <section className="page stack">
      <div>
        <h1>Dashboard</h1>
        <p>Recetas de accion para generar y enviar campanas con IA.</p>
      </div>
      <MetricsPanel />
      <section className="recipes-grid">
        {recipes.map(([title, description, type]) => (
          <ActionCard
            key={type}
            title={title}
            description={description}
            type={type}
          />
        ))}
      </section>
      <RecentTasks />
    </section>
  )
}
