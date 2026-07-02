import { useEffect, useState } from 'react'
import { Card } from '../components/ui/Card'
import { Spinner } from '../components/ui/Spinner'
import { getAnalytics } from '../lib/api'
import type { AnalyticsSummary } from '../types'

export function Analytics() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getAnalytics()
      .then(setSummary)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Error cargando KPIs'),
      )
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <section className="page"><Spinner /></section>

  return (
    <section className="page stack">
      <div>
        <h1>Analíticas</h1>
        <p>KPIs del pipeline de marketing.</p>
      </div>
      {error ? <p className="csv-error">⚠ {error}</p> : null}
      <section className="metrics-grid">
        <Card>
          <span>Campañas</span>
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

