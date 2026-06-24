import { useState } from 'react'
import { Button } from '../ui/Button'
import { runRecipe } from '../../lib/api'
import type { RecipeType } from '../../types'

interface RecipeParamsProps {
  type: RecipeType
}

export function RecipeParams({ type }: RecipeParamsProps) {
  const [days, setDays] = useState(60)
  const [message, setMessage] = useState<string | null>(null)

  async function handleRun() {
    setMessage('Procesando receta...')
    try {
      const response = await runRecipe({
        recipe_type: type,
        params: { dias: days },
      })
      setMessage(`Task ${response.task_id} creada con estado ${response.status}`)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Error ejecutando receta')
    }
  }

  return (
    <div className="card stack">
      <label>
        <span>Días de referencia</span>
        <input
          min={1}
          type="number"
          value={days}
          onChange={(event) => setDays(Number(event.target.value))}
        />
      </label>
      <Button type="button" onClick={() => void handleRun()}>
        Ejecutar receta
      </Button>
      {message ? <p>{message}</p> : null}
    </div>
  )
}
