import { Card } from '../ui/Card'
import { AppIcon } from '../ui/AppIcon'

export function RecentTasks() {
  return (
    <Card className="recent-activity">
      <span className="recent-icon">
        <AppIcon name="activity" size={29} />
      </span>
      <span className="recent-copy">
        <h3>Actividad reciente</h3>
        <p>Las campañas aparecerán aquí cuando Saul habilite GET /api/tasks.</p>
      </span>
      <span className="recent-orbit" aria-hidden="true">
        <i />
      </span>
    </Card>
  )
}
