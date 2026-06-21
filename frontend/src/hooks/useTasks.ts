import { useEffect, useState } from 'react'
import { getTasks } from '../lib/api'
import type { Task } from '../types'

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getTasks()
      .then(setTasks)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Could not load tasks')
      })
      .finally(() => setLoading(false))
  }, [])

  return { tasks, loading, error }
}
