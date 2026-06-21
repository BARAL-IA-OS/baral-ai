import { Navigate, useParams } from 'react-router-dom'
import { RecipeFlow } from '../components/recipes/RecipeFlow'
import type { RecipeType } from '../types'

const validRecipes: RecipeType[] = [
  'reactivacion',
  'bienvenida',
  'postventa',
  'lanzamiento',
  'propuesta',
]

export function Recipe() {
  const { type } = useParams()

  if (!validRecipes.includes(type as RecipeType)) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <section className="page">
      <RecipeFlow type={type as RecipeType} />
    </section>
  )
}
