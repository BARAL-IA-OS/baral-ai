import { ActionCard } from '../components/dashboard/ActionCard'
import { MetricsPanel } from '../components/dashboard/MetricsPanel'
import { RecentTasks } from '../components/dashboard/RecentTasks'
import { SavedStrategies } from '../components/dashboard/SavedStrategies'

const recipes = [
  ['Reactivar clientes', 'Clientes inactivos según días sin compra.', 'reactivacion'],
  ['Bienvenida', 'Primer contacto con propuesta de valor.', 'bienvenida'],
  ['Post-venta', 'Seguimiento después de una compra.', 'postventa'],
  ['Lanzamiento', 'Email y copy para producto nuevo.', 'lanzamiento'],
  ['Propuesta express', 'Borrador comercial estructurado.', 'propuesta'],
] as const

export function Dashboard() {
  return (
    <section className="page dashboard-page">
      <div className="dashboard-heading">
        <h1>Dashboard</h1>
        <p>Recetas de acción para generar y enviar campañas con IA.</p>
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

      <SavedStrategies />

      <RecentTasks />
    </section>
  )
}

