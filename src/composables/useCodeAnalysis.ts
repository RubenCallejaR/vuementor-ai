import { ref } from 'vue'
import type {
  AnalysisCategory,
  AnalysisFeedback,
  AnalysisResult,
  AnalyzeErrorResponse,
} from '@/types/analysis'

const CATEGORIES: AnalysisCategory[] = ['rendimiento', 'accesibilidad', 'tipado', 'buenasPracticas']

function isAnalysisFeedback(value: unknown): value is AnalysisFeedback {
  if (typeof value !== 'object' || value === null) return false
  const obj = value as Record<string, unknown>
  return CATEGORIES.every(
    (key) => Array.isArray(obj[key]) && obj[key].every((item) => typeof item === 'string'),
  )
}

function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  // Fallback para entornos sin crypto.randomUUID (algunos runners de test antiguos).
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function useCodeAnalysis() {
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const result = ref<AnalysisResult | null>(null)

  async function analyzeCode(code: string): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code }),
      })

      let data: unknown
      try {
        data = await response.json()
      } catch {
        error.value = 'La respuesta del servidor no es JSON válido.'
        return
      }

      if (!response.ok) {
        const message =
          typeof data === 'object' && data !== null && 'error' in data
            ? (data as AnalyzeErrorResponse).error
            : 'Ha ocurrido un error al analizar el código.'
        error.value = message
        return
      }

      if (!isAnalysisFeedback(data)) {
        error.value = 'La respuesta del servidor tiene un formato inesperado.'
        return
      }

      result.value = {
        id: createId(),
        timestamp: Date.now(),
        code,
        feedback: data,
      }
    } catch {
      error.value = 'No se pudo contactar con el servidor. Comprueba tu conexión.'
    } finally {
      isLoading.value = false
    }
  }

  function reset(): void {
    result.value = null
    error.value = null
  }

  return {
    isLoading,
    error,
    result,
    analyzeCode,
    reset,
  }
}