// api/analyze.ts
import type { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(req: VercelRequest, res: VercelResponse) {
  // TODO: leer el código Vue del body, construir el prompt estructurado
  // y llamar a la API de Claude usando process.env.ANTHROPIC_API_KEY (solo aquí, en el servidor)
}