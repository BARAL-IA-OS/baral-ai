import { useNavigate } from 'react-router-dom'
import { Users, HandMetal, ShoppingBag, Rocket, Zap } from 'lucide-react'
import { Card } from '../ui/Card'
import type { RecipeType } from '../../types'

interface ActionCardProps {
  title: string
  description: string
  type: RecipeType
}

const icons: Record<RecipeType, React.ElementType> = {
  reactivacion: Users,
  bienvenida: HandMetal,
  postventa: ShoppingBag,
  lanzamiento: Rocket,
  propuesta: Zap,
}

export function ActionCard({ title, description, type }: ActionCardProps) {
  const Icon = icons[type]
  const navigate = useNavigate()

  return (
    <Card className={`action-card action-card-${type}`}>
      <button
        type="button"
        className="action-card-btn"
        onClick={() => navigate(`/recipe/${type}`)}
      >
        <span className="action-icon">
          <Icon size={22} strokeWidth={1.75} />
        </span>
        <h3>{title}</h3>
        <p>{description}</p>
        <span className="action-card-cta">Configurar</span>
      </button>
    </Card>
  )
}
