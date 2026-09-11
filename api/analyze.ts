// api/analyze.ts
import type { VercelRequest, VercelResponse } from '@vercel/node'
import type { AnalysisCategory, AnalysisFeedback, AnalyzeRequestBody } from '../src/types/analysis'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models'
const MODEL = 'gemini-3.5-flash-lite'
const MAX_OUTPUT_TOKENS = 1000
const MAX_CODE_LENGTH = 20_000

const CATEGORIES: AnalysisCategory[] = ['rendimiento', 'accesibilidad', 'tipado', 'buenasPracticas']

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    rendimiento: { type: 'array', items: { type: 'string' } },
    accesibilidad: { type: 'array', items: { type: 'string' } },
    tipado: { type: 'array', items: { type: 'string' } },
    buenasPracticas: { type: 'array', items: { type: 'string' } },
  },
  required: CATEGORIES,
}

function buildPrompt(code: string): string {
  return `Eres un revisor experto de código Vue 3 + TypeScript. Analiza el siguiente componente
de un solo fichero (.vue) y da feedback de code review.

Componente a analizar:
\`\`\`vue
${code}
\`\`\`

Devuelve observaciones breves y concretas para cada categoría (rendimiento, accesibilidad,
tipado, buenasPracticas). Si no hay observaciones para una categoría, usa un array vacío.`
}

function isAnalysisFeedback(value: unknown): value is AnalysisFeedback {
  if (typeof value !== 'object' || value === null) return false
  const obj = value as Record<string, unknown>
  return CATEGORIES.every(
    (key) => Array.isArray(obj[key]) && obj[key].every((item) => typeof item === 'string'),
  )
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Método no permitido. Usa POST.' })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('[api/analyze] Falta la variable de entorno GEMINI_API_KEY')
    return res.status(500).json({ error: 'El servidor no está configurado correctamente.' })
  }

  let body: AnalyzeRequestBody
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  } catch {
    return res.status(400).json({ error: 'El body no es JSON válido.' })
  }

  const code = body?.code

  if (typeof code !== 'string' || code.trim().length === 0) {
    return res.status(400).json({ error: 'Falta el campo "code" (string) o está vacío.' })
  }

  if (code.length > MAX_CODE_LENGTH) {
    return res.status(400).json({ error: `El código supera el límite de ${MAX_CODE_LENGTH} caracteres.` })
  }

  let geminiResponse: Response
  try {
    geminiResponse = await fetch(`${GEMINI_API_URL}/${MODEL}:generateContent`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(code) }] }],
        generationConfig: {
          maxOutputTokens: MAX_OUTPUT_TOKENS,
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
        },
      }),
    })
  } catch (err) {
    console.error('[api/analyze] Fallo de red al llamar a la API de Gemini:', err)
    return res.status(502).json({ error: 'No se pudo contactar con el servicio de análisis.' })
  }

  if (!geminiResponse.ok) {
    const errorBody = await geminiResponse.text().catch(() => '')
    console.error(`[api/analyze] La API de Gemini respondió ${geminiResponse.status}:`, errorBody)
    return res.status(502).json({ error: 'El servicio de análisis devolvió un error.' })
  }

  let data: unknown
  try {
    data = await geminiResponse.json()
  } catch {
    return res.status(502).json({ error: 'Respuesta del servicio de análisis no es JSON válido.' })
  }

  const candidates = (
    data as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }
  )?.candidates
  const text = candidates?.[0]?.content?.parts?.[0]?.text

  if (!text) {
    console.error('[api/analyze] Respuesta de Gemini sin texto (posible bloqueo de seguridad):', data)
    return res.status(502).json({ error: 'Respuesta del modelo vacía o malformada.' })
  }

  let parsedFeedback: unknown
  try {
    parsedFeedback = JSON.parse(text)
  } catch {
    console.error('[api/analyze] No se pudo parsear el JSON del modelo:', text)
    return res.status(502).json({ error: 'El modelo devolvió un JSON malformado.' })
  }

  if (!isAnalysisFeedback(parsedFeedback)) {
    console.error('[api/analyze] El JSON del modelo no tiene la forma esperada:', parsedFeedback)
    return res.status(502).json({ error: 'El modelo devolvió una estructura inesperada.' })
  }

  return res.status(200).json(parsedFeedback)
}