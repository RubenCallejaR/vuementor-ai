import type { VercelRequest, VercelResponse } from '@vercel/node'
import type { AnalysisCategory, AnalysisFeedback, AnalyzeRequestBody } from '../src/types/analysis'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_VERSION = '2023-06-01'
const MODEL = 'claude-sonnet-5'
const MAX_TOKENS = 1000
const MAX_CODE_LENGTH = 20_000

const CATEGORIES: AnalysisCategory[] = ['rendimiento', 'accesibilidad', 'tipado', 'buenasPracticas']

function buildPrompt(code: string): string {
  return `Eres un revisor experto de código Vue 3 + TypeScript. Analiza el siguiente componente
de un solo fichero (.vue) y da feedback de code review.

Componente a analizar:
\`\`\`vue
${code}
\`\`\`

Devuelve EXCLUSIVAMENTE un objeto JSON válido (sin texto adicional, sin bloques de markdown,
sin explicaciones) con exactamente estas 4 claves, cada una como array de strings
(observaciones breves y concretas; si no hay observaciones para una categoría, usa un array vacío):

{
  "rendimiento": string[],
  "accesibilidad": string[],
  "tipado": string[],
  "buenasPracticas": string[]
}`
}

function isAnalysisFeedback(value: unknown): value is AnalysisFeedback {
  if (typeof value !== 'object' || value === null) return false
  const obj = value as Record<string, unknown>
  return CATEGORIES.every(
    (key) => Array.isArray(obj[key]) && obj[key].every((item) => typeof item === 'string'),
  )
}

/**
 * Claude a veces envuelve el JSON en un bloque ```json ... ``` aunque se le pida que no lo haga.
 * Lo limpiamos por seguridad antes de parsear.
 */
function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  return fenced ? fenced[1].trim() : text.trim()
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Método no permitido. Usa POST.' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('[api/analyze] Falta la variable de entorno ANTHROPIC_API_KEY')
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

  let anthropicResponse: Response
  try {
    anthropicResponse = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        messages: [{ role: 'user', content: buildPrompt(code) }],
      }),
    })
  } catch (err) {
    console.error('[api/analyze] Fallo de red al llamar a la API de Anthropic:', err)
    return res.status(502).json({ error: 'No se pudo contactar con el servicio de análisis.' })
  }

  if (!anthropicResponse.ok) {
    const errorBody = await anthropicResponse.text().catch(() => '')
    console.error(`[api/analyze] La API de Anthropic respondió ${anthropicResponse.status}:`, errorBody)
    return res.status(502).json({ error: 'El servicio de análisis devolvió un error.' })
  }

  let data: unknown
  try {
    data = await anthropicResponse.json()
  } catch {
    return res.status(502).json({ error: 'Respuesta del servicio de análisis no es JSON válido.' })
  }

  const content = (data as { content?: Array<{ type: string; text?: string }> })?.content
  const textBlock = content?.find((block) => block.type === 'text')

  if (!textBlock?.text) {
    console.error('[api/analyze] Respuesta de Anthropic sin bloque de texto:', data)
    return res.status(502).json({ error: 'Respuesta del modelo vacía o malformada.' })
  }

  let parsedFeedback: unknown
  try {
    parsedFeedback = JSON.parse(extractJson(textBlock.text))
  } catch {
    console.error('[api/analyze] No se pudo parsear el JSON del modelo:', textBlock.text)
    return res.status(502).json({ error: 'El modelo devolvió un JSON malformado.' })
  }

  if (!isAnalysisFeedback(parsedFeedback)) {
    console.error('[api/analyze] El JSON del modelo no tiene la forma esperada:', parsedFeedback)
    return res.status(502).json({ error: 'El modelo devolvió una estructura inesperada.' })
  }

  return res.status(200).json(parsedFeedback)
}