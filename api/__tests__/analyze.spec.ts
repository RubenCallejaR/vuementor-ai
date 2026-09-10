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
    process.env.ANTHROPIC_API_KEY = 'test-key'
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('devuelve 200, el feedback categorizado y usa el modelo claude-sonnet-5', async () => {
    const mockFeedback = {
      rendimiento: ['Evita recalcular en cada render'],
      accesibilidad: ['Añade aria-label al botón'],
      tipado: ['Tipa las props explícitamente'],
      buenasPracticas: ['Extrae la lógica a un composable'],
    }

    vi.mocked(fetch).mockResolvedValueOnce(
      mockFetchResponse(200, { content: [{ type: 'text', text: JSON.stringify(mockFeedback) }] }),
    )

    const req = createMockReq()
    const res = createMockRes()
    await handler(req, res)

    expect(fetch).toHaveBeenCalledWith(
      'https://api.anthropic.com/v1/messages',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"model":"claude-sonnet-5"'),
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

  it('devuelve 502 si falla la petición de red a Anthropic', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('network down'))

    const req = createMockReq()
    const res = createMockRes()
    await handler(req, res)

    expect(res.statusCode).toBe(502)
  })

  it('devuelve 502 si Claude responde con un JSON malformado', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockFetchResponse(200, { content: [{ type: 'text', text: 'esto no es JSON válido' }] }),
    )

    const req = createMockReq()
    const res = createMockRes()
    await handler(req, res)

    expect(res.statusCode).toBe(502)
  })
})