import type { TaskStatus } from '../../types'

interface TaskStatusBadgeProps {
  status: TaskStatus
}

export function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  let tone: 'neutral' | 'success' | 'warning' | 'danger' = 'warning'
  let label = status as string
  let isPulsing = false

  switch (status) {
    case 'CREATED':
      tone = 'neutral'
      label = 'Creado'
      break
    case 'PROCESSING':
      tone = 'warning'
      label = 'Procesando IA…'
      isPulsing = true
      break
    case 'PENDING_APPROVAL':
      tone = 'warning'
      label = 'Revisión pendiente'
      break
    case 'APPROVED':
      tone = 'success'
      label = 'Aprobado'
      break
    case 'EXECUTING':
      tone = 'neutral'
      label = 'Enviando…'
      isPulsing = true
      break
    case 'COMPLETED':
      tone = 'success'
      label = 'Completado'
      break
    case 'FAILED':
      tone = 'danger'
      label = 'Fallido'
      break
  }

  return (
    <span className={`badge badge-${tone} ${isPulsing ? 'badge-pulsing' : ''}`}>
      {isPulsing && <span className="badge-pulse-dot" />}
      {label}
    </span>
  )
}

