import type { RecipeType } from '../../types'
import { RecipeParams } from './RecipeParams'

interface RecipeFlowProps {
  type: RecipeType
}

export function RecipeFlow({ type }: RecipeFlowProps) {
  return (
    <section className="stack">
      <h1>Receta: {type}</h1>
      <RecipeParams type={type} />
    </section>
  )
}

