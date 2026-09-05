import { API_URL, apiRequest, authToken } from '../../lib/api'
import type {
  BrandAsset,
  BrandAssetType,
  BusinessDNA,
  BusinessDNASectionName,
  BusinessDNASections,
  CatalogItem,
  ExtractionJob,
  OnboardingProgress,
  BrandSource,
} from './types'

export function getBusinessDNA(): Promise<{ businessDNA: BusinessDNA | null; sources: BrandSource[] }> {
  return apiRequest('/api/business-dna')
}

export function saveBusinessDNASection<K extends BusinessDNASectionName>(
  section: K,
  value: BusinessDNASections[K],
  options: { onboardingStep?: number; onboardingPath?: 'url' | 'manual' } = {},
): Promise<{ success: boolean; businessDNA: BusinessDNA }> {
  return apiRequest(`/api/business-dna/sections/${section}`, {
    method: 'PATCH',
    body: JSON.stringify({
      value,
      onboarding_step: options.onboardingStep,
      onboarding_path: options.onboardingPath,
    }),
  })
}

export function getOnboardingProgress(): Promise<OnboardingProgress> {
  return apiRequest('/api/business-dna/onboarding')
}

export function completeOnboarding(confirmedSourceIds: string[] = []): Promise<{ success: boolean; businessDNA: BusinessDNA }> {
  return apiRequest('/api/business-dna/onboarding/complete', {
    method: 'POST',
    body: JSON.stringify({ confirmed_source_ids: confirmedSourceIds }),
  })
}

export function startBusinessExtraction(url: string): Promise<{ job: ExtractionJob }> {
  return apiRequest('/api/business-dna/extractions', {
    method: 'POST',
    body: JSON.stringify({ url }),
  })
}

export function getBusinessExtraction(jobId: string): Promise<{ job: ExtractionJob }> {
  return apiRequest(`/api/business-dna/extractions/${jobId}`)
}

export function confirmBusinessExtraction(job: ExtractionJob): Promise<{ success: boolean; businessDNA: BusinessDNA }> {
  if (!job.result) throw new Error('El análisis todavía no tiene resultados.')
  return apiRequest(`/api/business-dna/extractions/${job.id}/confirm`, {
    method: 'POST',
    body: JSON.stringify({
      sections: job.result.sections,
      catalog_items: job.result.catalogItems,
      source_ids: job.result.sources.map((source) => source.id),
    }),
  })
}

export function getCatalogItems(status = 'all'): Promise<{ items: CatalogItem[] }> {
  return apiRequest(`/api/catalog-items?status=${status}`)
}

export type CatalogItemInput = Omit<CatalogItem, 'id' | 'status' | 'created_at' | 'updated_at'>

export function createCatalogItem(input: CatalogItemInput): Promise<{ success: boolean; item: CatalogItem }> {
  return apiRequest('/api/catalog-items', { method: 'POST', body: JSON.stringify(input) })
}

export function updateCatalogItem(id: string, input: Partial<CatalogItem>): Promise<{ success: boolean; item: CatalogItem }> {
  return apiRequest(`/api/catalog-items/${id}`, { method: 'PATCH', body: JSON.stringify(input) })
}

export function deleteCatalogItem(id: string): Promise<{ success: boolean }> {
  return apiRequest(`/api/catalog-items/${id}`, { method: 'DELETE' })
}

export function getBrandAssets(): Promise<{ assets: BrandAsset[] }> {
  return apiRequest('/api/brand-assets')
}

export async function uploadBrandAssets(files: File[], assetType: BrandAssetType, catalogItemId?: string): Promise<{ success: boolean; assets: BrandAsset[] }> {
  const token = await authToken()
  const form = new FormData()
  files.forEach((file) => form.append('files', file))
  form.append('asset_type', assetType)
  if (catalogItemId) form.append('catalog_item_id', catalogItemId)
  const response = await fetch(`${API_URL}/api/brand-assets/upload`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form,
  })
  if (!response.ok) throw new Error(await response.text())
  return response.json() as Promise<{ success: boolean; assets: BrandAsset[] }>
}

export function importBrandAsset(url: string, assetType: BrandAssetType): Promise<{ success: boolean; asset: BrandAsset }> {
  return apiRequest('/api/brand-assets/import-url', {
    method: 'POST', body: JSON.stringify({ url, asset_type: assetType }),
  })
}

export function updateBrandAsset(id: string, input: Partial<BrandAsset>): Promise<{ success: boolean; asset: BrandAsset }> {
  return apiRequest(`/api/brand-assets/${id}`, { method: 'PATCH', body: JSON.stringify(input) })
}

export function deleteBrandAsset(id: string): Promise<{ success: boolean }> {
  return apiRequest(`/api/brand-assets/${id}`, { method: 'DELETE' })
}
