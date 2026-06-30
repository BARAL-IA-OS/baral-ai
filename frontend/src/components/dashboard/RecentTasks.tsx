import { Card } from '../ui/Card'
import { Activity } from 'lucide-react'

export function RecentTasks() {
  return (
    <Card className="recent-activity">
      <span className="recent-icon">
        <Activity size={20} strokeWidth={1.75} />
      </span>
      <span className="recent-copy">
        <h3>Actividad reciente</h3>
        <p>Las campañas aparecerán aquí cuando el backend esté conectado.</p>
      </span>
      <span className="recent-orbit" aria-hidden="true">
        <i />
      </span>
    </Card>
  )
}
