import { useEffect, useState } from 'react'
import { Card } from '../ui/Card'
import { Megaphone, Mail, Zap, Star } from 'lucide-react'
import { getAnalytics } from '../../lib/api'
import type { AnalyticsSummary } from '../../types'

export function MetricsPanel() {
  const [data, setData] = useState<AnalyticsSummary | null>(null)

  useEffect(() => {
    getAnalytics().then(setData).catch(() => undefined)
  }, [])

  const metrics = [
    { label: 'Campañas', value: data ? String(data.total_tasks) : '-', Icon: Megaphone, tone: 'violet', line: 'metric-line-one' },
    { label: 'Completadas', value: data ? String(data.completed_tasks) : '-', Icon: Mail, tone: 'indigo', line: 'metric-line-two' },
    { label: 'Costo total', value: data ? `$${data.total_cost_usd.toFixed(4)}` : '$-', Icon: Zap, tone: 'pink', line: 'metric-line-three' },
    { label: 'Score promedio', value: data ? (data.average_agent_score || '-').toString() : '-', Icon: Star, tone: 'blue', line: 'metric-line-four' },
  ]

  return (
    <section className="metrics-section">
      <div className="section-heading section-heading-compact">
        <div>
          <span>Resumen</span>
          <h2>Rendimiento rápido</h2>
        </div>
      </div>
      <div className="metrics-grid">
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
      </div>
    </section>
  )
}
