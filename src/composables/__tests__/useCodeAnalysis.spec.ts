// src/composables/__tests__/useCodeAnalysis.spec.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useCodeAnalysis } from '../useCodeAnalysis'

function mockFetchResponse(status: number, jsonBody: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => jsonBody,
  } as Response
}

describe('useCodeAnalysis', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('caso éxito: activa isLoading durante la llamada y rellena result al terminar', async () => {
    const mockFeedback = {
      rendimiento: ['Evita recalcular en cada render'],
      accesibilidad: ['Añade aria-label al botón'],
      tipado: ['Tipa las props explícitamente'],
      buenasPracticas: ['Extrae la lógica a un composable'],
    }

    vi.mocked(fetch).mockResolvedValueOnce(mockFetchResponse(200, mockFeedback))

    const { isLoading, error, result, analyzeCode } = useCodeAnalysis()

    const promise = analyzeCode('<template><div /></template>')
    expect(isLoading.value).toBe(true)

    await promise

    expect(fetch).toHaveBeenCalledWith(
      '/api/analyze',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ code: '<template><div /></template>' }),
      }),
    )
    expect(isLoading.value).toBe(false)
    expect(error.value).toBeNull()
    expect(result.value?.feedback).toEqual(mockFeedback)
    expect(result.value?.code).toBe('<template><div /></template>')
    expect(typeof result.value?.id).toBe('string')
    expect(typeof result.value?.timestamp).toBe('number')
  })

  it('caso error HTTP: guarda el mensaje del servidor y deja result a null', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockFetchResponse(400, { error: 'Falta el campo "code" (string) o está vacío.' }),
    )

    const { isLoading, error, result, analyzeCode } = useCodeAnalysis()
    await analyzeCode('')

    expect(isLoading.value).toBe(false)
    expect(error.value).toBe('Falta el campo "code" (string) o está vacío.')
    expect(result.value).toBeNull()
  })

  it('caso error de red: guarda un mensaje genérico y deja result a null', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('network down'))

    const { isLoading, error, result, analyzeCode } = useCodeAnalysis()
    await analyzeCode('const x = 1')

    expect(isLoading.value).toBe(false)
    expect(error.value).toBe('No se pudo contactar con el servidor. Comprueba tu conexión.')
    expect(result.value).toBeNull()
  })
})