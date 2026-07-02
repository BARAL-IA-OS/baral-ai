export type RecipeType =
  | 'reactivacion'
  | 'bienvenida'
  | 'postventa'
  | 'lanzamiento'
  | 'propuesta'

// Canales de salida. Email se ENVÍA (Resend). El resto, por ahora, solo se
// genera y se previsualiza (publicación directa = fase posterior).
export type ChannelType =
  | 'email'
  | 'whatsapp'
  | 'instagram'
  | 'facebook'
  | 'tiktok'

// Contenido de una pieza para preview por canal. El backend lo irá llenando;
// hoy el Studio usa datos de ejemplo para mostrar los mockups.
export interface SocialDraft {
  channel: ChannelType
  caption: string        // texto de la publicación / mensaje
  hashtags?: string[]    // para redes
  cta?: string
  mediaAlt?: string      // descripción de la imagen/infografía generada
}

export type TaskStatus =
  | 'CREATED'
  | 'PROCESSING'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'EXECUTING'
  | 'COMPLETED'
  | 'FAILED'

export interface BrandBrain {
  id: string
  industria: string
  propuesta: string
  tono: string
  audiencia: string
  diferenciador: string
  prohibiciones: string
}

export interface Client {
  id: string
  nombre: string
  email: string
  telefono?: string
  ultima_compra?: string
  producto?: string
}

export interface TaskDraftContent {
  asunto: string
  saludo: string
  cuerpo: string
  cta: string
}

export interface Task {
  id: string
  recipe_type: RecipeType
  status: TaskStatus
  params?: Record<string, unknown>
  draft_content?: TaskDraftContent
  recipients?: Client[]
  tokens_used: number
  cost_usd: number
  agent_score?: number
  error_log?: string
  created_at: string
  completed_at?: string
}

export interface RunRecipeRequest {
  recipe_type: RecipeType
  params: Record<string, unknown>
}

// Respuesta real de POST /api/recipes/run
export interface RunRecipeResponse {
  success: boolean
  task_id: string
  status: TaskStatus
  draft_content: TaskDraftContent
  recipients: Client[]
  tokens_used: number
  cost_usd: number
  agent_score: number
  provider?: string
}

// Respuesta real de POST /api/tasks/{id}/approve
export interface ApproveTaskResponse {
  success: boolean
  task_id: string
  status: TaskStatus
  emails_sent: number
  emails_failed: number
  provider?: string
  errors?: string[]
}

// Respuesta real de POST /api/onboarding/import-clients
export interface ImportClientsResponse {
  success: boolean
  imported: number
  skipped: number
  columns_detected: string[]
  errors: string[]
}

export interface AnalyticsSummary {
  total_tasks: number
  completed_tasks: number
  total_cost_usd: number
  average_agent_score: number
}
