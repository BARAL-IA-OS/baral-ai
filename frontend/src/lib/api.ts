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
  BrandBook,
  CampaignBrief,
  ChannelType,
  CreativeCampaign,
  GeneratedAsset,
  WebsiteAudit,
  ContentItem,
} from '../types'

export const API_URL =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.PROD
    ? 'https://baral-ai-api.onrender.com'
    : 'http://localhost:8000')

export async function authToken(): Promise<string> {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? ''
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
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

const request = apiRequest

async function requestBlob(path: string): Promise<Blob> {
  const token = await authToken()
  const res = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(await res.text())
  return res.blob()
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

// --- Suite creativa de OMAR ---

export function createCampaignBrief(body: {
  prompt: string
  product?: string
  audience?: string
  aspect_ratio?: string
  channels: ChannelType[]
  resources?: string[]
  idempotency_key?: string
}): Promise<{ success: boolean; campaign: CreativeCampaign }> {
  return request('/api/campaigns/brief', { method: 'POST', body: JSON.stringify(body) })
}

export function updateCampaignBrief(
  campaignId: string,
  brief: CampaignBrief,
): Promise<{ success: boolean; campaign: CreativeCampaign }> {
  return request(`/api/campaigns/${campaignId}/brief`, {
    method: 'PATCH', body: JSON.stringify({ brief }),
  })
}

export function generateCampaignContent(
  campaignId: string,
  brief?: CampaignBrief,
): Promise<{ success: boolean; campaign: CreativeCampaign }> {
  return request(`/api/campaigns/${campaignId}/generate`, {
    method: 'POST', body: JSON.stringify({ brief, idempotency_key: crypto.randomUUID() }),
  })
}

export function regenerateCampaignChannel(
  campaignId: string,
  channel: ChannelType,
  instruction = '',
): Promise<{ success: boolean; campaign: CreativeCampaign }> {
  return request(`/api/campaigns/${campaignId}/channels/${channel}/regenerate`, {
    method: 'POST', body: JSON.stringify({ instruction, idempotency_key: crypto.randomUUID() }),
  })
}

export function updateCampaignChannel(
  campaignId: string,
  channel: ChannelType,
  content: Partial<ContentItem>,
): Promise<{ success: boolean; campaign: CreativeCampaign }> {
  return request(`/api/campaigns/${campaignId}/channels/${channel}`, {
    method: 'PATCH', body: JSON.stringify({ content }),
  })
}

export function getCampaigns(): Promise<{ campaigns: CreativeCampaign[] }> {
  return request('/api/campaigns')
}

export function getCampaign(campaignId: string): Promise<{ campaign: CreativeCampaign }> {
  return request(`/api/campaigns/${campaignId}`)
}

export function generatePhotoshoot(body: {
  product: string
  prompt: string
  negative_prompt: string
  scene: string
  style: string
  aspect_ratio: string
  variants: number
  reference_assets?: string[]
}): Promise<{ success: boolean; assets: GeneratedAsset[]; cost_usd: number }> {
  return request('/api/photoshoots/generate', {
    method: 'POST', body: JSON.stringify({ ...body, idempotency_key: crypto.randomUUID() }),
  })
}

export function getGenerationStatus(assetId: string): Promise<{ generation: GeneratedAsset }> {
  return request(`/api/generations/${assetId}`)
}

export function saveGeneratedAsset(
  assetId: string,
  name: string,
  campaignId?: string,
): Promise<{ success: boolean; asset: GeneratedAsset }> {
  return request(`/api/assets/${assetId}/save`, {
    method: 'POST', body: JSON.stringify({ name, campaign_id: campaignId }),
  })
}

export async function uploadGeneratedAsset(file: File): Promise<{ success: boolean; asset: GeneratedAsset }> {
  const token = await authToken()
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${API_URL}/api/assets/upload`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form,
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json() as Promise<{ success: boolean; asset: GeneratedAsset }>
}

export function createBrandBook(body: {
  title: string
  cover_url?: string
  selected_assets: string[]
}): Promise<{ success: boolean; brand_book: BrandBook }> {
  return request('/api/brand-books', { method: 'POST', body: JSON.stringify(body) })
}

export function exportBrandBookPdf(brandBookId: string): Promise<Blob> {
  return requestBlob(`/api/brand-books/${brandBookId}/pdf`)
}

export function authorizeWebsiteAudit(
  url: string,
): Promise<{ success: boolean; consent: { id: string; url: string; domain: string; authorized_at: string } }> {
  return request('/api/audits/consent', {
    method: 'POST', body: JSON.stringify({ url, accepted: true }),
  })
}

export function runWebsiteAudit(consentId: string): Promise<{ success: boolean; audit: WebsiteAudit }> {
  return request('/api/audits/run', {
    method: 'POST', body: JSON.stringify({ consent_id: consentId, idempotency_key: crypto.randomUUID() }),
  })
}

export function getWebsiteAuditResult(auditId: string): Promise<{ audit: WebsiteAudit }> {
  return request(`/api/audits/${auditId}`)
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
