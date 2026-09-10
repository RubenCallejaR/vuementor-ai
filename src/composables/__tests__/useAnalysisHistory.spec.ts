import { describe, it, expect, beforeEach } from 'vitest'
import { useAnalysisHistory } from '../useAnalysisHistory'
import type { AnalysisResult } from '@/types/analysis'

function createResult(overrides: Partial<AnalysisResult> = {}): AnalysisResult {
  return {
    id: overrides.id ?? Math.random().toString(36).slice(2),
    timestamp: overrides.timestamp ?? Date.now(),
    code: overrides.code ?? 'const x = 1',
    feedback: overrides.feedback ?? {
      rendimiento: [],
      accesibilidad: [],
      tipado: [],
      buenasPracticas: [],
    },
  }
}

describe('useAnalysisHistory', () => {
  beforeEach(() => {
    // El estado es un singleton a nivel de módulo (compartido entre
    // componentes durante la sesión), así que lo reseteamos entre tests.
    useAnalysisHistory().clear()
  })

  it('empieza vacío', () => {
    const { history } = useAnalysisHistory()
    expect(history.value).toEqual([])
  })

  it('añade una entrada al principio del historial', () => {
    const { history, addEntry } = useAnalysisHistory()
    const entry = createResult({ id: '1' })

    addEntry(entry)

    expect(history.value).toHaveLength(1)
    expect(history.value[0]).toEqual(entry)
  })

  it('las entradas más recientes van primero', () => {
    const { history, addEntry } = useAnalysisHistory()

    addEntry(createResult({ id: '1' }))
    addEntry(createResult({ id: '2' }))
    addEntry(createResult({ id: '3' }))

    expect(history.value.map((entry) => entry.id)).toEqual(['3', '2', '1'])
  })

  it('mantiene como máximo 5 entradas, descartando las más antiguas', () => {
    const { history, addEntry } = useAnalysisHistory()

    for (let i = 1; i <= 7; i++) {
      addEntry(createResult({ id: String(i) }))
    }

    expect(history.value).toHaveLength(5)
    expect(history.value.map((entry) => entry.id)).toEqual(['7', '6', '5', '4', '3'])
  })

  it('clear() vacía el historial', () => {
    const { history, addEntry, clear } = useAnalysisHistory()
    addEntry(createResult())

    clear()

    expect(history.value).toEqual([])
  })

  it('comparte el estado entre distintas llamadas al composable (singleton de sesión)', () => {
    const first = useAnalysisHistory()
    const second = useAnalysisHistory()

    first.addEntry(createResult({ id: 'shared' }))

    expect(second.history.value).toHaveLength(1)
    expect(second.history.value[0]!.id).toBe('shared')
  })
})