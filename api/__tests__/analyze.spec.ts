// api/__tests__/analyze.spec.ts
// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import handler from '../analyze'

function mockFetchResponse(status: number, jsonBody: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => jsonBody,
    text: async () => JSON.stringify(jsonBody),
  } as Response
}

function mockGeminiSuccess(feedback: unknown) {
  return mockFetchResponse(200, {
    candidates: [{ content: { parts: [{ text: JSON.stringify(feedback) }] } }],
  })
}

function createMockRes() {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    headers: {} as Record<string, string>,
    status(code: number) {
      this.statusCode = code
      return this
    },
    json(payload: unknown) {
      this.body = payload
      return this
    },
    setHeader(name: string, value: string) {
      this.headers[name] = value
      return this
    },
  }
  return res as unknown as VercelResponse & { statusCode: number; body: unknown }
}

function createMockReq(overrides: Partial<VercelRequest> = {}): VercelRequest {
  return {
    method: 'POST',
    body: { code: '<template><div /></template>' },
    ...overrides,
  } as VercelRequest
}

describe('POST /api/analyze', () => {
  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'test-key'
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('devuelve 200, el feedback categorizado y llama al modelo gemini-3.5-flash-lite', async () => {
    const mockFeedback = {
      rendimiento: ['Evita recalcular en cada render'],
      accesibilidad: ['Añade aria-label al botón'],
      tipado: ['Tipa las props explícitamente'],
      buenasPracticas: ['Extrae la lógica a un composable'],
    }

    vi.mocked(fetch).mockResolvedValueOnce(mockGeminiSuccess(mockFeedback))

    const req = createMockReq()
    const res = createMockRes()
    await handler(req, res)

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('gemini-3.5-flash-lite:generateContent'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'x-goog-api-key': 'test-key' }),
      }),
    )
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual(mockFeedback)
  })

  it('devuelve 400 si falta el campo code', async () => {
    const req = createMockReq({ body: {} })
    const res = createMockRes()
    await handler(req, res)

    expect(fetch).not.toHaveBeenCalled()
    expect(res.statusCode).toBe(400)
  })

  it('devuelve 502 si falla la petición de red a Gemini', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('network down'))

    const req = createMockReq()
    const res = createMockRes()
    await handler(req, res)

    expect(res.statusCode).toBe(502)
  })

  it('devuelve 502 si Gemini responde sin candidatos (p. ej. bloqueo de seguridad)', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(mockFetchResponse(200, { candidates: [] }))

    const req = createMockReq()
    const res = createMockRes()
    await handler(req, res)

    expect(res.statusCode).toBe(502)
  })

  it('devuelve 502 si el JSON del modelo no tiene la forma esperada', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(mockGeminiSuccess({ foo: 'bar' }))

    const req = createMockReq()
    const res = createMockRes()
    await handler(req, res)

    expect(res.statusCode).toBe(502)
  })
})