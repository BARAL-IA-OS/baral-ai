import { supabase } from './supabase'
import type {
  AnalyticsSummary,
  RunRecipeRequest,
  RunRecipeResponse,
  Task,
} from '../types'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

async function getHeaders() {
  const { data } = await supabase.auth.getSession()

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${data.session?.access_token ?? ''}`,
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(await getHeaders()),
      ...init?.headers,
    },
  })

  if (!res.ok) {
    throw new Error(await res.text())
  }

  return res.json() as Promise<T>
}

export function runRecipe(
  body: RunRecipeRequest,
): Promise<RunRecipeResponse> {
  return request('/api/recipes/run', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function approveTask(taskId: string): Promise<Task> {
  return request(`/api/tasks/${taskId}/approve`, {
    method: 'POST',
  })
}

export function getTasks(): Promise<Task[]> {
  return request('/api/tasks')
}

export function getAnalytics(): Promise<AnalyticsSummary> {
  return request('/api/analytics/summary')
}
