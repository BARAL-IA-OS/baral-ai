import { Link } from 'react-router-dom'
import { Card } from '../ui/Card'
import { ArrowRight, Users, HandMetal, ShoppingBag, Rocket, Zap } from 'lucide-react'
import type { RecipeType } from '../../types'

interface ActionCardProps {
  title: string
  description: string
  type: RecipeType
}

const icons: Record<RecipeType, React.ElementType> = {
  reactivacion: Users,
  bienvenida:   HandMetal,
  postventa:    ShoppingBag,
  lanzamiento:  Rocket,
  propuesta:    Zap,
}

export function ActionCard({ title, description, type }: ActionCardProps) {
  const Icon = icons[type]

  return (
    <Card className={`action-card action-card-${type}`}>
      <span className="action-icon">
        <Icon size={20} strokeWidth={1.75} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      <Link to={`/recipe/${type}`}>
        Configurar
        <ArrowRight size={14} strokeWidth={2} />
      </Link>
    </Card>
  )
}
