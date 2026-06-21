import { Badge } from '../ui/Badge'

export function SetupProgress() {
  return (
    <div className="progress-row">
      <Badge tone="success">Auth</Badge>
      <Badge tone="warning">Brand Brain</Badge>
      <Badge>Clientes CSV</Badge>
    </div>
  )
}
