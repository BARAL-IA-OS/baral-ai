import { useEffect, useState, useCallback } from 'react'
import { getTask, parseApiError } from '../lib/api'
import type { Task } from '../types'

export function useTask(taskId: string | undefined) {
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(Boolean(taskId))
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!taskId) return
    setLoading(true)
    setError(null)
    try {
      const data = await getTask(taskId)
      setTask(data)
    } catch (err) {
      setError(parseApiError(err))
    } finally {
      setLoading(false)
    }
  }, [taskId])

  useEffect(() => {
    let active = true
    if (!taskId) {
      return
    }

    Promise.resolve().then(() => {
      if (active) {
        setLoading(true)
        setError(null)
      }
    })

    getTask(taskId)
      .then((data) => {
        if (active) setTask(data)
      })
      .catch((err: unknown) => {
        if (active) {
          setError(parseApiError(err))
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [taskId])

  return { task, loading, error, refetch }
}

