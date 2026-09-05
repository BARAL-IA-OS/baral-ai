export type BusinessDNASectionName =
  | 'identity'
  | 'positioning'
  | 'audience_profile'
  | 'communication'
  | 'visual_identity'
  | 'operations'
  | 'social_proof'

export interface BusinessDNASections {
  identity: {
    name?: string
    industry?: string
    description?: string
    websiteUrl?: string
  }
  positioning: {
    valueProposition?: string
    differentiators?: string
  }
  audience_profile: {
    targetAudience?: string
    market?: string
  }
  communication: {
    tone?: string
    style?: string
    keyMessages?: string
    callsToAction?: string
    forbiddenWords?: string
  }
  visual_identity: {
    logoAssetId?: string
    logoCandidates?: string[]
    colors?: string[]
    fonts?: string[]
  }
  operations: {
    address?: string
    city?: string
    country?: string
    phones?: string[]
    emails?: string[]
    whatsapp?: string
    openingHours?: string
    socialLinks?: Array<{ network: string; url: string }>
    importantLinks?: string[]
  }
  social_proof: {
    testimonials?: string
    trustSignals?: string
    frequentlyAskedQuestions?: string
  }
}

export interface BusinessDNA {
  id: string
  sections: BusinessDNASections
  onboardingStep: number
  onboardingPath: 'url' | 'manual' | null
  activeExtractionJobId?: string | null
  onboardingCompletedAt: string | null
  completionPercentage: number
  updatedAt?: string
}

export interface OnboardingProgress {
  exists: boolean
  completed: boolean
  currentStep: number
  path: 'url' | 'manual' | null
  activeExtractionJobId?: string | null
  completionPercentage: number
  businessDNA: BusinessDNA | null
}

export interface CatalogItem {
  id: string
  kind: 'product' | 'service'
  name: string
  category?: string
  description?: string
  price?: number | null
  currency: string
  cta?: string
  featured: boolean
  status: 'active' | 'archived'
  source_url?: string
  created_at?: string
  updated_at?: string
}

export type BrandAssetType = 'logo' | 'product' | 'photo' | 'background' | 'reference' | 'previous_piece'

export interface BrandAsset {
  id: string
  catalog_item_id?: string | null
  title: string
  description?: string
  tags: string[]
  asset_type: BrandAssetType
  storage_path: string
  original_filename: string
  mime_type: string
  size_bytes: number
  width?: number
  height?: number
  source_url?: string
  signed_url?: string | null
  status: 'active' | 'archived'
  created_at: string
}

export interface BrandSource {
  id: string
  field_path: string
  detected_value: unknown
  source_url: string
  confidence: 'high' | 'medium' | 'low'
  confirmed_by_user: boolean
}

export interface ExtractionJob {
  id: string
  source_url: string
  status: 'queued' | 'running' | 'completed' | 'failed'
  current_stage: number
  progress: number
  stage_label: string
  error?: string
  result?: {
    sections: BusinessDNASections
    catalogItems: Array<Partial<CatalogItem>>
    sources: BrandSource[]
    pagesRead: string[]
  }
}
