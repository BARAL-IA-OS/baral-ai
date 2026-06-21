import { Badge } from '../ui/Badge'
import type { TaskStatus } from '../../types'

interface TaskStatusBadgeProps {
  status: TaskStatus
}

export function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  const tone = status === 'COMPLETED' ? 'success' : status === 'FAILED' ? 'danger' : 'warning'

  return <Badge tone={tone}>{status}</Badge>
}
