import type { RecipeType } from '../../types'
import { RecipeParams } from './RecipeParams'

interface RecipeFlowProps {
  type: RecipeType
}

export function RecipeFlow({ type }: RecipeFlowProps) {
  return (
    <section className="stack">
      <h1>Receta: {type}</h1>
      <div className="pending-backend-banner">
        <span>⏳</span>
        <div>
          <strong>Pendiente de backend</strong>
          <p>Este flujo consume <code>POST /api/recipes/run</code>. Coordinar contrato con Omar/Saúl.</p>
        </div>
      </div>
      <RecipeParams type={type} />
    </section>
  )
}
