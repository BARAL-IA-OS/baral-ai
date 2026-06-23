import { Card } from '../ui/Card'
import { AppIcon } from '../ui/AppIcon'

const metrics = [
  { label: 'Campañas', value: '0', icon: 'campaign', tone: 'violet', line: 'metric-line-one' },
  { label: 'Emails enviados', value: '0', icon: 'email', tone: 'indigo', line: 'metric-line-two' },
  { label: 'Costo total', value: '$0.00', icon: 'spark', tone: 'pink', line: 'metric-line-three' },
  { label: 'Score promedio', value: '-', icon: 'star', tone: 'blue', line: 'metric-line-four' },
] as const

export function MetricsPanel() {
  return (
    <section className="metrics-grid">
      {metrics.map((metric) => (
        <Card key={metric.label} className={`metric-card metric-${metric.tone}`}>
          <span className="metric-icon">
            <AppIcon name={metric.icon} size={27} />
          </span>
          <span className="metric-copy">
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </span>
          <svg className="metric-chart" viewBox="0 0 220 34" preserveAspectRatio="none" aria-hidden="true">
            <path className={metric.line} d="M2 25 18 19 34 23 50 14 66 22 82 26 98 18 114 16 130 23 146 12 162 21 178 15 194 19 218 10" />
          </svg>
        </Card>
      ))}
    </section>
  )
}
