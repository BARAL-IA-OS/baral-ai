import { Link } from 'react-router-dom'
import { Card } from '../ui/Card'
import type { RecipeType } from '../../types'

interface ActionCardProps {
  title: string
  description: string
  type: RecipeType
}

export function ActionCard({ title, description, type }: ActionCardProps) {
  return (
    <Card className="action-card">
      <h3>{title}</h3>
      <p>{description}</p>
      <Link to={`/recipe/${type}`}>Configurar</Link>
    </Card>
  )
}
