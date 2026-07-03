import { useState, useRef, useEffect } from 'react'
import { runRecipe, getTask } from '../lib/api'
import type { RecipeType, TaskStatus } from '../types'

export type RunnerStatus = 'idle' | 'submitting' | 'polling' | 'success' | 'error'

export function useRecipeRunner() {
  const [runnerStatus, setRunnerStatus] = useState<RunnerStatus>('idle')
  const [taskStatus, setTaskStatus] = useState<TaskStatus | null>(null)
  const [taskId, setTaskId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimers = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current)
      pollingTimeoutRef.current = null
    }
  }

  useEffect(() => {
    return () => clearTimers()
  }, [])

  const startPolling = (tid: string) => {
    clearTimers()
    setRunnerStatus('polling')
    setMessage('Procesando campaña con Inteligencia Artificial...')

    pollingTimeoutRef.current = setTimeout(() => {
      clearTimers()
      setRunnerStatus('error')
      setError('La operación superó el límite de tiempo. Verifica el historial.')
    }, 120_000)

    pollingIntervalRef.current = setInterval(async () => {
      try {
        const task = await getTask(tid)
        setTaskStatus(task.status)

        if (task.status === 'PROCESSING') {
          setMessage('IA trabajando: generando textos y auditando contenido...')
        } else if (task.status === 'PENDING_APPROVAL') {
          clearTimers()
          setRunnerStatus('success')
          setMessage('Campaña generada correctamente, lista para aprobación.')
        } else if (task.status === 'COMPLETED' || task.status === 'APPROVED') {
          clearTimers()
          setRunnerStatus('success')
          setMessage('Campaña completada.')
        } else if (task.status === 'FAILED') {
          clearTimers()
          setRunnerStatus('error')
          setError('El flujo de Inteligencia Artificial falló al procesar la campaña.')
        }
      } catch (err) {
        console.error('Error durante el polling del task:', err)
      }
    }, 2500)
  }

  const run = async (recipeType: RecipeType, params: Record<string, unknown>) => {
    setRunnerStatus('submitting')
    setTaskId(null)
    setTaskStatus(null)
    setError(null)
    setMessage('Inicializando receta en el servidor...')

    try {
      const response = await runRecipe({
        recipe_type: recipeType,
        params,
      })

      if (response.success && response.task_id) {
        setTaskId(response.task_id)
        setTaskStatus(response.status)

        if (response.status === 'PENDING_APPROVAL') {
          setRunnerStatus('success')
          setMessage('Campaña lista para aprobación.')
        } else {
          startPolling(response.task_id)
        }
      } else {
        setRunnerStatus('error')
        setError('El servidor no pudo iniciar el proceso de la receta.')
      }
    } catch (err) {
      setRunnerStatus('error')
      setError(err instanceof Error ? err.message : 'Error al conectar con el servidor.')
    }
  }

  return {
    run,
    runnerStatus,
    taskStatus,
    taskId,
    message,
    error,
    reset: () => {
      clearTimers()
      setRunnerStatus('idle')
      setTaskId(null)
      setTaskStatus(null)
      setMessage(null)
      setError(null)
    },
  }
}
