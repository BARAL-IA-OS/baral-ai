import { Card } from '../ui/Card'
import { Megaphone, Mail, Zap, Star } from 'lucide-react'

const metrics = [
  { label: 'Campañas',      value: '0',     Icon: Megaphone, tone: 'violet', line: 'metric-line-one' },
  { label: 'Emails enviados', value: '0',   Icon: Mail,      tone: 'indigo', line: 'metric-line-two' },
  { label: 'Costo total',   value: '$0.00', Icon: Zap,       tone: 'pink',   line: 'metric-line-three' },
  { label: 'Score promedio', value: '-',    Icon: Star,      tone: 'blue',   line: 'metric-line-four' },
] as const

export function MetricsPanel() {
  return (
    <section className="metrics-grid">
      {metrics.map((metric) => (
        <Card key={metric.label} className={`metric-card metric-${metric.tone}`}>
          <span className="metric-icon">
            <metric.Icon size={18} strokeWidth={1.75} />
          </span>
          <span className="metric-copy">
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </span>
          <svg className="metric-chart" viewBox="0 0 220 28" preserveAspectRatio="none" aria-hidden="true">
            <path className={metric.line} d="M2 20 18 16 34 19 50 11 66 18 82 22 98 14 114 12 130 19 146 9 162 17 178 11 194 15 218 7" />
          </svg>
        </Card>
      ))}
    </section>
  )
}
