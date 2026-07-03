import { ActionCard } from '../components/dashboard/ActionCard'
import { MetricsPanel } from '../components/dashboard/MetricsPanel'
import { RecentTasks } from '../components/dashboard/RecentTasks'
import { SavedStrategies } from '../components/dashboard/SavedStrategies'
import { useAuth } from '../hooks/useAuth'

const recipes = [
  ['Reactivar clientes', 'Recupera clientes inactivos según días sin compra con mensajes personalizados.', 'reactivacion'],
  ['Bienvenida', 'Primer contacto cálido con tu propuesta de valor para clientes nuevos.', 'bienvenida'],
  ['Post-venta', 'Seguimiento inteligente despues de una compra para fidelizar.', 'postventa'],
  ['Lanzamiento', 'Email y copy multicanal para anunciar tu nuevo producto o servicio.', 'lanzamiento'],
  ['Propuesta express', 'Borrador comercial estructurado y profesional en segundos.', 'propuesta'],
] as const

export function Dashboard() {
  const { user } = useAuth()
  const companyName = (user?.user_metadata?.company_name as string)?.trim()
  const greetingName = companyName || user?.email?.split('@')[0] || 'ahí'

  return (
    <section className="page dashboard-page">
      <div className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <span className="dashboard-eyebrow">Centro de acciones</span>
          <h1>{`Hola, ${greetingName}`}</h1>
          <p>Elige una receta, genera una campaña y revisa el rendimiento desde un solo lugar.</p>
        </div>
      </div>

      <section className="recipes-section" id="acciones">
        <div className="section-heading">
          <div>
            <span>Recetas de acción</span>
            <h2>¿Qué quieres ejecutar hoy?</h2>
          </div>
          <p>Plantillas listas para crear campañas rápidas con el contexto de tu marca.</p>
        </div>
        <div className="recipes-grid">
          {recipes.map(([title, description, type]) => (
            <ActionCard
              key={type}
              title={title}
              description={description}
              type={type}
            />
          ))}
        </div>
      </section>

      <MetricsPanel />

      <div className="dashboard-bottom-grid">
        <SavedStrategies />
        <RecentTasks />
      </div>
    </section>
  )
}
