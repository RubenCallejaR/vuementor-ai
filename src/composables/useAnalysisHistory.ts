import { ref } from 'vue'
import type { AnalysisResult } from '@/types/analysis'

const MAX_HISTORY_ENTRIES = 5

// Estado a nivel de módulo: compartido por todas las llamadas a
// useAnalysisHistory() durante la sesión (singleton mientras la pestaña
// esté abierta; no persiste al recargar la página).
const history = ref<AnalysisResult[]>([])

export function useAnalysisHistory() {
  function addEntry(entry: AnalysisResult): void {
    history.value = [entry, ...history.value].slice(0, MAX_HISTORY_ENTRIES)
  }

  function clear(): void {
    history.value = []
  }

  return {
    history,
    addEntry,
    clear,
  }
}