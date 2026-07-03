import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '../ui/Button'
import { useRecipeRunner } from '../../hooks/useRecipeRunner'
import type { RecipeType } from '../../types'

interface RecipeParamsProps {
  type: RecipeType
}

export function RecipeParams({ type }: RecipeParamsProps) {
  const [days, setDays] = useState(60)
  const { run, runnerStatus, taskStatus, taskId, message, error } = useRecipeRunner()
  const navigate = useNavigate()
  const location = useLocation()

  // Pre-load parameters from strategy when redirected
  useEffect(() => {
    const state = location.state as { params?: { dias?: number } } | null
    const dias = state?.params?.dias
    if (dias) {
      Promise.resolve().then(() => setDays(dias))
    }
  }, [location])

  // Auto-navigate to preview when the task is ready
  useEffect(() => {
    if (runnerStatus === 'success' && taskId) {
      const timer = setTimeout(() => {
        navigate(`/preview/${taskId}`)
      }, 1200)
      return () => clearTimeout(timer)
    }
  }, [runnerStatus, taskId, navigate])

  async function handleRun() {
    await run(type, { dias: days })
  }


  const busy = runnerStatus !== 'idle'

  return (
    <div className="stack">
      <div className="card stack">
        <label>
          <span>Días de referencia</span>
          <input
            min={1}
            type="number"
            value={days}
            disabled={busy}
            onChange={(event) => setDays(Number(event.target.value))}
          />
        </label>
        <Button type="button" disabled={busy} onClick={() => void handleRun()}>
          {busy ? 'Procesando…' : 'Ejecutar receta'}
        </Button>
      </div>

      {/* Stepper de progreso del pipeline IA */}
      {busy && (
        <div className="card stack" style={{ gap: '1rem' }}>
          <strong>Pipeline de Inteligencia Artificial</strong>

          <div className="stack" style={{ gap: '0.5rem' }}>
            <Step
              n={1}
              label="Orquestación"
              detail="Filtrando base de datos"
              done={runnerStatus === 'polling' || runnerStatus === 'success'}
              active={runnerStatus === 'submitting'}
            />
            <Step
              n={2}
              label="Copywriter IA"
              detail="Generando piezas y asunto"
              done={runnerStatus === 'success'}
              active={runnerStatus === 'polling' && taskStatus !== 'PENDING_APPROVAL'}
            />
            <Step
              n={3}
              label="Revisor & Score"
              detail="Auditoría de políticas"
              done={taskStatus === 'PENDING_APPROVAL' || runnerStatus === 'success'}
              active={false}
            />
          </div>

          <p style={{ fontSize: '0.875rem', opacity: 0.8 }}>
            {error ? `⚠ ${error}` : message}
          </p>
        </div>
      )}
    </div>
  )
}

/* ── mini step indicator ────────────────────────────── */

function Step({ n, label, detail, done, active }: {
  n: number; label: string; detail: string; done: boolean; active: boolean
}) {
  const color = done ? 'var(--color-success, #10b981)' : active ? 'var(--color-primary, #6366f1)' : 'var(--color-muted, #888)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <span style={{
        width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700,
        border: `2px solid ${color}`, color, background: done ? color : 'transparent',
        ...(done ? { color: '#fff' } : {}),
      }}>
        {done ? '✓' : n}
      </span>
      <span>
        <strong style={{ color }}>{label}</strong>
        <br />
        <small style={{ opacity: 0.7 }}>{detail}</small>
      </span>
    </div>
  )
}

