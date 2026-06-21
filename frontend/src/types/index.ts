export type RecipeType =
  | 'reactivacion'
  | 'bienvenida'
  | 'postventa'
  | 'lanzamiento'
  | 'propuesta'

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
  dias_inactivo?: number
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
  created_at: string
  completed_at?: string
}

export interface RunRecipeRequest {
  recipe_type: RecipeType
  params: Record<string, unknown>
}

export interface RunRecipeResponse {
  success: boolean
  task_id: string
  status: TaskStatus
}

export interface AnalyticsSummary {
  total_tasks: number
  completed_tasks: number
  total_cost_usd: number
  average_agent_score: number
}
