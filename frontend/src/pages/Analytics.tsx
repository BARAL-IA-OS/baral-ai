import { useEffect, useState } from 'react'
import { Card } from '../components/ui/Card'
import { getAnalytics } from '../lib/api'
import type { AnalyticsSummary } from '../types'

export function Analytics() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getAnalytics()
      .then(setSummary)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Error cargando KPIs'),
      )
  }, [])

  return (
    <section className="page stack">
      <div>
        <h1>Analiticas</h1>
        <p>KPIs reales del prototipo cuando el backend este disponible.</p>
      </div>
      {error ? <p>{error}</p> : null}
      <section className="metrics-grid">
        <Card>
          <span>Campanas</span>
          <strong>{summary?.total_tasks ?? 0}</strong>
        </Card>
        <Card>
          <span>Completadas</span>
          <strong>{summary?.completed_tasks ?? 0}</strong>
        </Card>
        <Card>
          <span>Costo</span>
          <strong>${summary?.total_cost_usd ?? '0.00'}</strong>
        </Card>
        <Card>
          <span>Score</span>
          <strong>{summary?.average_agent_score ?? '-'}</strong>
        </Card>
      </section>
    </section>
  )
}
