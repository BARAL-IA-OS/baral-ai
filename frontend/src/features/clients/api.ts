import { API_URL, apiRequest, authToken } from '../../lib/api'
import type {
  Client360,
  Client360Input,
  ClientImportJob,
  ClientImportSummary,
  ClientSegment,
  ClientStats,
} from './types'

export interface ClientFilters {
  page?: number
  pageSize?: number
  search?: string
  status?: string
  source?: string
  interest?: string
  product?: string
  purchasedAfter?: string
  purchasedBefore?: string
  sort?: 'nombre' | 'created_at' | 'ultima_compra' | 'lifecycle_status'
  direction?: 'asc' | 'desc'
}

export function getClients(filters: ClientFilters = {}): Promise<{
  clients: Client360[]
  total: number
  page: number
  pageSize: number
}> {
  const params = new URLSearchParams()
  if (filters.page) params.set('page', String(filters.page))
  if (filters.pageSize) params.set('page_size', String(filters.pageSize))
  if (filters.search) params.set('search', filters.search)
  if (filters.status) params.set('status', filters.status)
  if (filters.source) params.set('source', filters.source)
  if (filters.interest) params.set('interest', filters.interest)
  if (filters.product) params.set('product', filters.product)
  if (filters.purchasedAfter) params.set('purchased_after', filters.purchasedAfter)
  if (filters.purchasedBefore) params.set('purchased_before', filters.purchasedBefore)
  if (filters.sort) params.set('sort', filters.sort)
  if (filters.direction) params.set('direction', filters.direction)
  return apiRequest(`/api/clients?${params.toString()}`)
}

export function getClientStats(): Promise<ClientStats> {
  return apiRequest('/api/clients/stats')
}

export function createClient(input: Client360Input): Promise<{ success: boolean; client: Client360 }> {
  return apiRequest('/api/clients', { method: 'POST', body: JSON.stringify(input) })
}

export function updateClient(id: string, input: Partial<Client360Input>): Promise<{ success: boolean; client: Client360 }> {
  return apiRequest(`/api/clients/${id}`, { method: 'PATCH', body: JSON.stringify(input) })
}

export function deleteClient(id: string): Promise<{ success: boolean }> {
  return apiRequest(`/api/clients/${id}`, { method: 'DELETE' })
}

export async function previewClientImport(file: File): Promise<{ import: ClientImportJob }> {
  const token = await authToken()
  const form = new FormData()
  form.append('file', file)
  const response = await fetch(`${API_URL}/api/clients/imports`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form,
  })
  if (!response.ok) throw new Error(await response.text())
  return response.json() as Promise<{ import: ClientImportJob }>
}

export function mapClientImport(importId: string, mapping: Record<string, string>): Promise<{
  import: ClientImportJob
  summary: ClientImportSummary
}> {
  return apiRequest(`/api/clients/imports/${importId}/mapping`, {
    method: 'PATCH', body: JSON.stringify({ mapping }),
  })
}

export function confirmClientImport(importId: string, duplicateStrategy: 'skip' | 'update'): Promise<{
  success: boolean
  created: number
  updated: number
  skipped: number
  errors: string[]
}> {
  return apiRequest(`/api/clients/imports/${importId}/confirm`, {
    method: 'POST', body: JSON.stringify({ duplicate_strategy: duplicateStrategy }),
  })
}

export function getClientSegments(): Promise<{ segments: ClientSegment[] }> {
  return apiRequest('/api/clients/segments')
}

export function saveClientSegment(input: { name: string; description?: string; filters: Record<string, unknown> }): Promise<{
  success: boolean
  segment: ClientSegment
}> {
  return apiRequest('/api/clients/segments', { method: 'POST', body: JSON.stringify(input) })
}

export function getSegmentRecipients(segmentId: string): Promise<{ segmentId: string; clientIds: string[]; clients: Client360[] }> {
  return apiRequest(`/api/clients/segments/${segmentId}/recipients`)
}
