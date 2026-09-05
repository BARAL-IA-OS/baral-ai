export type ClientLifecycleStatus = 'new' | 'active' | 'inactive' | 'vip' | 'do_not_contact'

export interface Client360 {
  id: string
  nombre: string
  email?: string | null
  telefono?: string | null
  company?: string | null
  producto?: string | null
  interest?: string | null
  source?: string | null
  lifecycle_status: ClientLifecycleStatus
  ultima_compra?: string | null
  last_purchase_amount?: number | null
  tags: string[]
  notes?: string | null
  contact_consent: boolean
  created_at?: string
  updated_at?: string
}

export type Client360Input = Omit<Client360, 'id' | 'created_at' | 'updated_at'>

export interface ClientStats {
  total: number
  active: number
  inactive: number
  new: number
  withoutContact: number
}

export interface ClientSegment {
  id: string
  name: string
  description?: string
  filters: Record<string, unknown>
  created_at: string
}

export interface ClientImportJob {
  id: string
  filename: string
  headers: string[]
  suggested_mapping: Record<string, string>
  mapping: Record<string, string>
  preview_rows: Array<Record<string, unknown>>
  status: 'uploaded' | 'mapped' | 'completed' | 'failed'
}

export interface ClientImportSummary {
  valid: number
  duplicates: number
  errors: string[]
}
