import { Link } from 'react-router-dom'
import { Card } from '../ui/Card'
import type { RecipeType } from '../../types'
import { AppIcon } from '../ui/AppIcon'

interface ActionCardProps {
  title: string
  description: string
  type: RecipeType
}

export function ActionCard({ title, description, type }: ActionCardProps) {
  const icons = {
    reactivacion: 'users',
    bienvenida: 'hand',
    postventa: 'bag',
    lanzamiento: 'rocket',
    propuesta: 'spark',
  } as const

  return (
    <Card className={`action-card action-card-${type}`}>
      <span className="action-icon">
        <AppIcon name={icons[type]} size={27} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      <Link to={`/recipe/${type}`}>
        Configurar
        <AppIcon name="arrow" size={19} />
      </Link>
    </Card>
  )
}
