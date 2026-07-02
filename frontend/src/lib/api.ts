import { supabase } from './supabase'
import type {
  AnalyticsSummary,
  ApproveTaskResponse,
  ImportClientsResponse,
  RunRecipeRequest,
  RunRecipeResponse,
  Task,
} from '../types'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

async function authToken(): Promise<string> {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? ''
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await authToken()
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  })

  if (!res.ok) {
    throw new Error(await res.text())
  }

  return res.json() as Promise<T>
}

// --- Recetas / pipeline de IA ---

export function runRecipe(body: RunRecipeRequest): Promise<RunRecipeResponse> {
  return request('/api/recipes/run', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

// --- Tareas / campañas ---

export async function getTasks(limit = 20): Promise<Task[]> {
  const data = await request<{ tasks: Task[] }>(`/api/tasks?limit=${limit}`)
  return data.tasks
}

export function approveTask(taskId: string): Promise<ApproveTaskResponse> {
  return request(`/api/tasks/${taskId}/approve`, { method: 'POST' })
}

// --- Analíticas ---

export function getAnalytics(): Promise<AnalyticsSummary> {
  return request('/api/analytics/summary')
}

// --- Onboarding: importar clientes desde CSV (multipart) ---

export async function importClients(file: File): Promise<ImportClientsResponse> {
  const token = await authToken()
  const form = new FormData()
  form.append('file', file)

  // No seteamos Content-Type: el navegador agrega el boundary del multipart.
  const res = await fetch(`${API_URL}/api/onboarding/import-clients`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })

  if (!res.ok) {
    throw new Error(await res.text())
  }

  return res.json() as Promise<ImportClientsResponse>
}
