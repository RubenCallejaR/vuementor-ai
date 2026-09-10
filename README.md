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


## Componente: `CodeEditor.vue`

Editor de código embebido basado en CodeMirror 6, con resaltado de sintaxis
para Vue (plantilla + `<script>`/`<script lang="ts">` embebidos) y tema oscuro (One Dark).

### Props

| Prop | Tipo | Requerida | Descripción |
|---|---|---|---|
| `code` | `string` | Sí | Contenido inicial/controlado del editor. Si cambia desde el padre (p. ej. al cargar un ejemplo), el editor se sincroniza automáticamente sin perder el foco. |

### Eventos

| Evento | Payload | Cuándo se emite |
|---|---|---|
| `update:code` | `string` | Cada vez que cambia el documento del editor (tecleo, pegado, undo/redo...), con el contenido completo actualizado. No se emite al montar. |

### Uso (v-model)

\`\`\`vue
<CodeEditor v-model:code="userCode" />
\`\`\`

Al usar el par `code` / `update:code`, el componente es compatible de forma nativa con `v-model:code` de Vue 3.


## Composable: `useCodeAnalysis`

Gestiona la llamada a `POST /api/analyze` desde el frontend: estado de carga,
error y resultado tipado.

### API

\`\`\`ts
const { isLoading, error, result, analyzeCode, reset } = useCodeAnalysis()
\`\`\`

| Propiedad | Tipo | Descripción |
|---|---|---|
| `isLoading` | `Ref<boolean>` | `true` mientras la petición está en curso. |
| `error` | `Ref<string \| null>` | Mensaje de error legible si algo falla (validación, red, respuesta malformada, error del servidor). `null` si no hay error. |
| `result` | `Ref<AnalysisResult \| null>` | Resultado del último análisis correcto (ver `AnalysisResult` en `src/types/analysis.ts`). `null` hasta que hay un resultado. |
| `analyzeCode(code)` | `(code: string) => Promise<void>` | Llama al endpoint con el código dado. Actualiza `isLoading`, `error` y `result`. Nunca lanza excepciones: cualquier fallo se refleja en `error`. |
| `reset()` | `() => void` | Limpia `result` y `error` (útil, por ejemplo, al pegar un código nuevo antes de volver a analizar). |

### Uso típico

\`\`\`vue
<script setup lang="ts">
import { useCodeAnalysis } from '@/composables/useCodeAnalysis'

const { isLoading, error, result, analyzeCode } = useCodeAnalysis()
</script>

<template>
  <button :disabled="isLoading" @click="analyzeCode(userCode)">
    {{ isLoading ? 'Analizando...' : 'Analizar' }}
  </button>

  <p v-if="error">{{ error }}</p>
</template>
\`\`\`

### Desarrollo local

`vite dev` por sí solo **no** sirve `/api/analyze` (es una función serverless de Vercel). Para probar el flujo completo en local necesitas `vercel dev` en lugar de (o además de) `npm run dev`.