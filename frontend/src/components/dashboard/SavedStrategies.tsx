import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2, Play, Clock } from 'lucide-react'
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
    void fetchStrategies()
  }, [])

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation() // Evitar navegación al hacer clic en el botón de borrar
    if (!confirm('¿Estás seguro de que quieres eliminar esta estrategia?')) return
    try {
      const res = await deleteStrategy(id)
      if (res.success) {
        setStrategies((prev) => prev.filter((s) => s.id !== id))
      }
    } catch (err) {
      alert(parseApiError(err))
    }
  }

  const handleSelect = (strategy: SavedStrategy) => {
    navigate(`/recipe/${strategy.recipe_type}`, {
      state: { params: strategy.params }
    })
  }

  if (loading) {
    return (
      <div className="card stack" style={{ padding: '2rem', alignItems: 'center' }}>
        <p>Cargando estrategias guardadas…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-banner">⚠ {error}</div>
    )
  }

  if (strategies.length === 0) {
    return (
      <div className="card empty-strategies-card" style={{ padding: '1.5rem', textAlign: 'center', background: 'rgba(255,255,255,0.01)' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)' }}>Mis Estrategias Guardadas</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          No tienes estrategias guardadas todavía. Envía una campaña con éxito y guárdala para verla aquí.
        </p>
      </div>
    )
  }

  return (
    <div className="stack" style={{ gap: '12px' }}>
      <h2 style={{ fontSize: '1.15rem', fontWeight: 700, paddingLeft: '4px' }}>Mis Estrategias Guardadas</h2>
      
      <div className="strategies-grid">
        {strategies.map((strategy) => {
          const dateStr = strategy.last_used_at
            ? new Date(strategy.last_used_at).toLocaleDateString('es-ES', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : '–'

          return (
            <div
              key={strategy.id}
              className="card strategy-card"
              onClick={() => handleSelect(strategy)}
              style={{ cursor: 'pointer', position: 'relative' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 className="strategy-title" style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                    {strategy.name}
                  </h3>
                  <span className="badge badge-neutral" style={{ marginTop: '6px', textTransform: 'capitalize' }}>
                    {strategy.recipe_type}
                  </span>
                </div>
                <button
                  type="button"
                  className="strategy-delete-btn"
                  onClick={(e) => void handleDelete(e, strategy.id)}
                  title="Eliminar estrategia"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="strategy-meta">
                <div className="meta-item">
                  <Play size={12} />
                  <span>{strategy.times_used} {strategy.times_used === 1 ? 'ejecución' : 'ejecuciones'}</span>
                </div>
                <div className="meta-item">
                  <Clock size={12} />
                  <span>Última vez: {dateStr}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
