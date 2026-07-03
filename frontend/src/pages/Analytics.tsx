import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Spinner } from '../components/ui/Spinner'
import { getAnalytics, parseApiError } from '../lib/api'
import { Inbox } from 'lucide-react'
import type { AnalyticsSummary } from '../types'

export function Analytics() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getAnalytics()
      .then(setSummary)
      .catch((err: unknown) => setError(parseApiError(err)))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <section className="page"><Spinner label="Cargando analíticas…" /></section>

  return (
    <section className="page stack">
      <div>
        <h1>Analíticas</h1>
        <p>KPIs del flujo de marketing.</p>
      </div>
      {error && <div className="error-banner">⚠ {error}</div>}

      {summary && summary.total_tasks === 0 && !error && (
        <div className="empty-state">
          <span className="empty-state-icon">
            <Inbox size={24} strokeWidth={1.5} />
          </span>
          <strong>Aún no hay datos</strong>
          <p>Las métricas se calcularán automáticamente cuando ejecutes tu primera campaña.</p>
          <Link to="/dashboard">Ir al Dashboard →</Link>
        </div>
      )}

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


