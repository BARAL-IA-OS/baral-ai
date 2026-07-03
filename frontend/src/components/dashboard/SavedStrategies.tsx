import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2, Play, Clock, Bookmark } from 'lucide-react'
import { getStrategies, deleteStrategy, parseApiError } from '../../lib/api'
import type { SavedStrategy } from '../../types'

export function SavedStrategies() {
  const [strategies, setStrategies] = useState<SavedStrategy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const fetchStrategies = async () => {
    try {
      setLoading(true)
      const res = await getStrategies()
      setStrategies(res.strategies || [])
    } catch (err) {
      setError(parseApiError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void Promise.resolve().then(fetchStrategies)
  }, [])

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm('¿Eliminar esta estrategia?')) return
    try {
      const res = await deleteStrategy(id)
      if (res.success) {
        setStrategies((prev) => prev.filter((strategy) => strategy.id !== id))
      }
    } catch (err) {
      alert(parseApiError(err))
    }
  }

  const handleSelect = (strategy: SavedStrategy) => {
    navigate(`/recipe/${strategy.recipe_type}`, {
      state: { params: strategy.params },
    })
  }

  if (loading) {
    return (
      <section className="dashboard-panel saved-strategies-panel">
        <div className="panel-heading">
          <span className="panel-icon"><Bookmark size={16} /></span>
          <div>
            <span>Estrategias</span>
            <h2>Guardadas</h2>
          </div>
        </div>
        <p className="panel-muted">Cargando estrategias guardadas...</p>
      </section>
    )
  }

  if (error) {
    return <div className="error-banner">{error}</div>
  }

  return (
    <section className="dashboard-panel saved-strategies-panel">
      <div className="panel-heading">
        <span className="panel-icon"><Bookmark size={16} /></span>
        <div>
          <span>Estrategias</span>
          <h2>Guardadas</h2>
        </div>
      </div>

      {strategies.length === 0 ? (
        <div className="panel-empty">
          <strong>Aún no tienes estrategias guardadas</strong>
          <p>Genera una campaña y guárdala para reutilizarla desde aquí.</p>
        </div>
      ) : (
        <div className="strategies-grid">
          {strategies.map((strategy) => {
            const dateStr = strategy.last_used_at
              ? new Date(strategy.last_used_at).toLocaleDateString('es-ES', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '-'

            return (
              <div
                key={strategy.id}
                role="button"
                tabIndex={0}
                className="strategy-card"
                onClick={() => handleSelect(strategy)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') handleSelect(strategy)
                }}
              >
                <span className="strategy-card-top">
                  <span>
                    <strong>{strategy.name}</strong>
                    <small>{strategy.recipe_type}</small>
                  </span>
                  <button
                    type="button"
                    className="strategy-delete-btn"
                    onClick={(e) => void handleDelete(e, strategy.id)}
                    title="Eliminar estrategia"
                  >
                    <Trash2 size={14} />
                  </button>
                </span>

                <span className="strategy-meta">
                  <span className="meta-item">
                    <Play size={12} />
                    {strategy.times_used} {strategy.times_used === 1 ? 'ejecución' : 'ejecuciones'}
                  </span>
                  <span className="meta-item">
                    <Clock size={12} />
                    Última vez: {dateStr}
                  </span>
                </span>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
