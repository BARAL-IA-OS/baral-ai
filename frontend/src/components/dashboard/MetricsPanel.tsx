import { Card } from '../ui/Card'

const metrics = [
  ['Campanas', '0'],
  ['Emails enviados', '0'],
  ['Costo total', '$0.00'],
  ['Score promedio', '-'],
]

export function MetricsPanel() {
  return (
    <section className="metrics-grid">
      {metrics.map(([label, value]) => (
        <Card key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </Card>
      ))}
    </section>
  )
}
