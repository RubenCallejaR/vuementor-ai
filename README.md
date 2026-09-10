## API: `POST /api/analyze`

Analiza un componente Vue y devuelve feedback de code review generado por Claude.

**Modelo:** `claude-sonnet-5` (constante `MODEL` en `api/analyze.ts`).

### Request

- **Método:** `POST`
- **Content-Type:** `application/json`
- **Body:**

\`\`\`json
{
  "code": "<script setup lang=\"ts\">...</script><template>...</template>"
}
\`\`\`

### Response — 200 OK

\`\`\`json
{
  "rendimiento": ["..."],
  "accesibilidad": ["..."],
  "tipado": ["..."],
  "buenasPracticas": ["..."]
}
\`\`\`

### Errores

| Código | Causa |
|---|---|
| 400 | `code` ausente, vacío o demasiado largo (>20 000 caracteres) |
| 405 | Método distinto de `POST` |
| 500 | Falta `ANTHROPIC_API_KEY` en el servidor |
| 502 | Fallo de red hacia la API de Anthropic, respuesta no-2xx, JSON malformado o con forma inesperada |

Todos los errores devuelven `{ "error": "mensaje" }`.

### Configurar la API key

1. Copia `.env.example` a `.env` y añade tu clave:
   \`\`\`
   ANTHROPIC_API_KEY=sk-ant-...
   \`\`\`
2. `.env` está en `.gitignore`: la clave nunca se sube al repo ni se incluye en el bundle del cliente, solo la lee `api/analyze.ts` en el servidor.
3. En Vercel, configúrala en **Project Settings → Environment Variables** (o `vercel env add ANTHROPIC_API_KEY`) para Production, Preview y Development.