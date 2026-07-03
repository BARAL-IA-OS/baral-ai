import { useEffect, useState } from 'react'
import { getUsage } from '../../lib/api'

const TOKEN_LIMIT = 500_000 // Configurable monthly limit

export function TokenUsageBar() {
  const [used, setUsed] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getUsage()
      .then((data) => {
        // Sum up total tokens from by_kind breakdown
        const totalTokens = Object.values(data.by_kind ?? {}).reduce(
          (sum, v) => sum + (v.tokens ?? 0),
          0,
        )
        setUsed(totalTokens)
      })
      .catch(() => setUsed(0))
      .finally(() => setLoading(false))
  }, [])

  const percentage = Math.min((used / TOKEN_LIMIT) * 100, 100)
  const barColor =
    percentage > 85
      ? 'var(--danger)'
      : percentage > 60
        ? 'var(--warning)'
        : 'var(--success)'

  const formatNumber = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
    return String(n)
  }

  if (loading) {
    return (
      <div className="token-bar">
        <div className="token-bar-track">
          <div className="token-bar-fill token-bar-loading" style={{ width: '30%' }} />
        </div>
        <span className="token-bar-label">Cargando...</span>
      </div>
    )
  }

  return (
    <div className="token-bar">
      <div className="token-bar-track">
        <div
          className="token-bar-fill"
          style={{ width: `${percentage}%`, background: barColor }}
        />
      </div>
      <span className="token-bar-label">
        {formatNumber(used)} / {formatNumber(TOKEN_LIMIT)} tokens
      </span>
    </div>
  )
}
