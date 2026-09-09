// src/types/analysis.ts

export type AnalysisCategory =
  | 'rendimiento'
  | 'accesibilidad'
  | 'tipado'
  | 'buenasPracticas'

export interface CategoryFeedback {
  category: AnalysisCategory
  // TODO: severidad, lista de comentarios, etc. (se define en el siguiente paso)
}

export interface AnalysisResult {
  timestamp: number
  // TODO: array de CategoryFeedback y el código original analizado
}