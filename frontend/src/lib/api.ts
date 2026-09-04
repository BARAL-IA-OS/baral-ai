import { supabase } from './supabase'
import type {
  AnalyticsSummary,
  ApproveTaskResponse,
  BrandExtractResponse,
  Client,
  GenerateContentRequest,
  GenerateContentResponse,
  GenerateImageResponse,
  ImportClientsResponse,
  RunRecipeRequest,
  RunRecipeResponse,
  Task,
  TaskDraftContent,
  UsageSummary,
  RegenerateTaskResponse,
  SavedStrategy,
} from '../types'

const API_URL =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.PROD
    ? 'https://baral-ai-api.onrender.com'
    : 'http://localhost:8000')

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

export function getTask(taskId: string): Promise<Task> {
  return request(`/api/tasks/${taskId}`)
}

export function approveTask(
  taskId: string,
  draft?: TaskDraftContent,
): Promise<ApproveTaskResponse> {
  return request(`/api/tasks/${taskId}/approve`, {
    method: 'POST',
    body: JSON.stringify(draft ? { draft_content: draft } : {}),
  })
}

// --- Analíticas ---

export function getAnalytics(): Promise<AnalyticsSummary> {
  return request('/api/analytics/summary')
}

// --- Estudio: generación de contenido multicanal ---

export function generateContent(
  body: GenerateContentRequest,
): Promise<GenerateContentResponse> {
  return request('/api/content/generate', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

// Genera UNA imagen bajo demanda (prompt = media_alt del canal).
export function generateImage(prompt: string): Promise<GenerateImageResponse> {
  return request('/api/content/image', {
    method: 'POST',
    body: JSON.stringify({ prompt }),
  })
}

// --- Gasto de generación (registro de costos) ---

export function getUsage(): Promise<UsageSummary> {
  return request('/api/usage/summary')
}

// --- Brand Brain: ingestión desde URL o documento ---

export function extractBrandFromUrl(url: string): Promise<BrandExtractResponse> {
  return request('/api/brand/extract-url', {
    method: 'POST',
    body: JSON.stringify({ url }),
  })
}

export async function extractBrandFromFile(file: File): Promise<BrandExtractResponse> {
  const token = await authToken()
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${API_URL}/api/brand/extract-file`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })
  if (!res.ok) {
    throw new Error(await res.text())
  }
  return res.json() as Promise<BrandExtractResponse>
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

export function regenerateTaskField(
  taskId: string,
  field: 'asunto' | 'saludo' | 'cuerpo' | 'cta',
  currentDraft: TaskDraftContent
): Promise<RegenerateTaskResponse> {
  return request(`/api/tasks/${taskId}/regenerate`, {
    method: 'POST',
    body: JSON.stringify({ field, current_draft: currentDraft }),
  })
}

export function getStrategies(): Promise<{ strategies: SavedStrategy[] }> {
  return request('/api/strategies')
}

export function createStrategy(name: string, taskId: string): Promise<{ success: boolean; strategy: SavedStrategy }> {
  return request('/api/strategies', {
    method: 'POST',
    body: JSON.stringify({ name, task_id: taskId }),
  })
}

export function deleteStrategy(id: string): Promise<{ success: boolean }> {
  return request(`/api/strategies/${id}`, {
    method: 'DELETE',
  })
}

// --- Clientes ---

export function getClients(): Promise<{ clients: Client[] }> {
  return request('/api/clients')
}

export function deleteClient(id: string): Promise<{ success: boolean }> {
  return request(`/api/clients/${id}`, {
    method: 'DELETE',
  })
}

// --- Utilidad: parsear errores de la API ---

/**
 * Extrae un mensaje legible de un error de la API.
 * El backend de FastAPI devuelve `{"detail":"..."}` en errores HTTP.
 * Sin esto, el usuario ve JSON crudo como `{"detail":"Not Found"}`.
 */
export function parseApiError(err: unknown): string {
  if (!(err instanceof Error)) return 'Error desconocido.'
  const raw = err.message
  try {
    const parsed = JSON.parse(raw) as { detail?: string }
    if (parsed.detail) return parsed.detail
  } catch {
    // No es JSON, usar el mensaje tal cual
  }
  if (raw === 'Failed to fetch') return 'No se pudo conectar con el servidor.'
  return raw || 'Error desconocido.'
}
