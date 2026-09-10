export type AnalysisCategory =
  | 'rendimiento'
  | 'accesibilidad'
  | 'tipado'
  | 'buenasPracticas'

/** Forma cruda que devuelve POST /api/analyze: cada categoría -> array de observaciones. */
export type AnalysisFeedback = Record<AnalysisCategory, string[]>

/** Forma que consumirá FeedbackCard.vue: una categoría a la vez. */
export interface CategoryFeedback {
  category: AnalysisCategory
  suggestions: string[]
}

/** Una entrada del historial de sesión (Feature 5). */
export interface AnalysisResult {
  id: string
  timestamp: number
  code: string
  feedback: AnalysisFeedback
}

/** Body que espera el endpoint. */
export interface AnalyzeRequestBody {
  code: string
}

/** Forma de cualquier respuesta de error del endpoint. */
export interface AnalyzeErrorResponse {
  error: string
}