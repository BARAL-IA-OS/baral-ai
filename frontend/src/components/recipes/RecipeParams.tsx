import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Check, Loader2, Play, CalendarClock } from 'lucide-react'
import { Button } from '../ui/Button'
import { useRecipeRunner } from '../../hooks/useRecipeRunner'
import type { RecipeType } from '../../types'
import { InlineTaskPreview } from './InlineTaskPreview'

interface RecipeParamsProps {
  type: RecipeType
}

const DAY_PRESETS = [
  { value: 30, label: '1 mes' },
  { value: 60, label: '2 meses' },
  { value: 90, label: '3 meses' },
  { value: 180, label: '6 meses' },
  { value: 365, label: '1 año' },
]

// Recetas basadas en días: chips (solo clics) + frase clara.
const dayRecipes: Partial<Record<RecipeType, {
  title: string
  sentence: (d: number) => string
}>> = {
  reactivacion: {
    title: '¿Hace cuánto dejaron de comprar?',
    sentence: (d) => `Buscaremos clientes que no compran hace ${d} días o más.`,
  },
  postventa: {
    title: '¿Hace cuánto fue la compra?',
    sentence: (d) => `Daremos seguimiento a clientes que compraron hace ${d} días o menos.`,
  },
  bienvenida: {
    title: '¿Qué tan nuevos son los clientes?',
    sentence: (d) => `Saludaremos a clientes registrados hace ${d} días o menos.`,
  },
}

// Recetas sin días: no piden nada, se ejecutan con el Brand Brain.
const simpleHints: Partial<Record<RecipeType, string>> = {
  lanzamiento: 'Crearemos una campaña para presentar una novedad, con el tono de tu marca.',
  propuesta: 'Armaremos un borrador comercial estructurado, listo para revisar.',
}

export function RecipeParams({ type }: RecipeParamsProps) {
  const [days, setDays] = useState(60)
  const { run, runnerStatus, taskStatus, taskId, message, error } = useRecipeRunner()
  const location = useLocation()

  const dayConfig = dayRecipes[type]
  const isDayBased = Boolean(dayConfig)

  useEffect(() => {
    const state = location.state as { params?: { dias?: number } } | null
    const dias = state?.params?.dias
    if (dias) {
      Promise.resolve().then(() => setDays(dias))
    }
  }, [location])

  async function handleRun() {
    const params = isDayBased ? { dias: days } : {}
    await run(type, params)
  }

  const busy = runnerStatus !== 'idle'
  const processing = busy && runnerStatus !== 'success'

  return (
    <div className="recipe-flow-stack">
      <div className="recipe-main-card recipe-main-card-focused">
        {isDayBased ? (
          <>
            <div className="recipe-card-heading">
              <span className="panel-icon"><CalendarClock size={16} /></span>
              <div>
                <span>Paso 1</span>
                <h2>{dayConfig!.title}</h2>
                <p>Elige un rango. No necesitas escribir nada.</p>
              </div>
            </div>

            <div className="recipe-day-chips" role="radiogroup" aria-label="Rango de tiempo">
              {DAY_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  role="radio"
                  aria-checked={days === preset.value}
                  className={`recipe-day-chip ${days === preset.value ? 'is-active' : ''}`}
                  disabled={processing}
                  onClick={() => setDays(preset.value)}
                >
                  <strong>{preset.label}</strong>
                  <small>{preset.value} días</small>
                </button>
              ))}
            </div>

            <p className="recipe-day-sentence">{dayConfig!.sentence(days)}</p>
          </>
        ) : (
          <>
            <div className="recipe-card-heading">
              <span className="panel-icon"><CalendarClock size={16} /></span>
              <div>
                <span>Listo</span>
                <h2>Genera con un clic</h2>
                <p>{simpleHints[type] ?? 'Se ejecutará con el contexto de tu marca.'}</p>
              </div>
            </div>
          </>
        )}

        <Button type="button" disabled={processing} onClick={() => void handleRun()}>
          {processing ? (
            <>
              <Loader2 size={16} className="spin-icon" />
              Generando borrador
            </>
          ) : (
            <>
              <Play size={16} />
              Generar borrador
            </>
          )}
        </Button>

        {(processing || error) && (
          <div className="recipe-pipeline-card">
            <strong>Baral AI está trabajando</strong>

            <div className="recipe-steps">
              <Step
                n={1}
                label="Seleccionando clientes"
                detail="Filtrando la base de datos"
                done={runnerStatus === 'polling' || runnerStatus === 'success'}
                active={runnerStatus === 'submitting'}
              />
              <Step
                n={2}
                label="Escribiendo campaña"
                detail="Generando asunto, saludo, cuerpo y CTA"
                done={runnerStatus === 'success'}
                active={runnerStatus === 'polling' && taskStatus !== 'PENDING_APPROVAL'}
              />
              <Step
                n={3}
                label="Preparando revisión"
                detail="Dejando el resultado listo para aprobar"
                done={taskStatus === 'PENDING_APPROVAL' || runnerStatus === 'success'}
                active={false}
              />
            </div>

            <p className={error ? 'recipe-message recipe-message-error' : 'recipe-message'}>
              {error || message}
            </p>
          </div>
        )}
      </div>

      {runnerStatus === 'success' && taskId && (
        <InlineTaskPreview taskId={taskId} />
      )}
    </div>
  )
}

function Step({ n, label, detail, done, active }: {
  n: number
  label: string
  detail: string
  done: boolean
  active: boolean
}) {
  return (
    <div className={`recipe-step ${done ? 'is-done' : ''} ${active ? 'is-active' : ''}`}>
      <span>{done ? <Check size={14} /> : n}</span>
      <div>
        <strong>{label}</strong>
        <small>{detail}</small>
      </div>
    </div>
  )
}
