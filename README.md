## API: `POST /api/analyze`

Analiza un componente Vue y devuelve feedback de code review generado por Gemini.

**Modelo:** `gemini-3.5-flash-lite` (constante `MODEL` en `api/analyze.ts`) — nivel gratuito
de la API de Gemini. Verifica en https://ai.google.dev/gemini-api/docs/pricing que este
modelo sigue en el nivel "Free" antes de asumir coste cero; Google retira modelos a nuevos
usuarios con frecuencia (ya pasó una vez con `gemini-2.5-flash-lite`).

**Aviso de privacidad:** en el nivel gratuito de Gemini, Google puede usar el contenido
enviado (en este caso, el código pegado por el usuario) para mejorar sus productos. Si vas
a usar esto con código real/privado, ten esto en cuenta o pasa a un nivel de pago.

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
| 500 | Falta `GEMINI_API_KEY` en el servidor |
| 502 | Fallo de red hacia la API de Gemini, respuesta no-2xx, respuesta bloqueada por el filtro de seguridad, JSON malformado o con forma inesperada |

Todos los errores devuelven `{ "error": "mensaje" }`.

### Configurar la API key

1. Consigue una key gratis en [Google AI Studio](https://aistudio.google.com/app/apikey) (inicia sesión con una cuenta de Google → "Create API key"; no requiere tarjeta para el nivel gratuito).
2. Copia `.env.example` a `.env` y añade tu clave:
   \`\`\`
   GEMINI_API_KEY=AIza...
   \`\`\`
3. `.env` está en `.gitignore`: la clave nunca se sube al repo ni se incluye en el bundle del cliente.
4. En Vercel, configúrala en **Project Settings → Environment Variables** (o `vercel env add GEMINI_API_KEY`) para Production, Preview y Development.


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


## Componente: `FeedbackCard.vue`

Tarjeta que muestra las observaciones de una categoría del análisis, con
icono y color propios.

### Props

| Prop | Tipo | Requerida | Descripción |
|---|---|---|---|
| `category` | `AnalysisCategory` (`'rendimiento' \| 'accesibilidad' \| 'tipado' \| 'buenasPracticas'`) | Sí | Determina el título, el icono y el color de la tarjeta. |
| `suggestions` | `string[]` | Sí | Observaciones a mostrar. Si el array está vacío, se muestra "Sin observaciones para esta categoría." en su lugar. |

### Uso

\`\`\`vue
<FeedbackCard category="rendimiento" :suggestions="['Evita recalcular en cada render']" />
\`\`\`

## Flujo en `App.vue`

`App.vue` conecta las piezas: `CodeEditor` (v-model:code) → botón
"Analizar" (llama a `analyzeCode` de `useCodeAnalysis`) → una
`FeedbackCard` por cada una de las 4 categorías, en orden fijo
(rendimiento, accesibilidad, tipado, buenasPracticas). Los errores de
`useCodeAnalysis` se muestran en un mensaje encima de las tarjetas.


## Composable: `useAnalysisHistory`

Guarda los últimos 5 análisis de la sesión (código + resultado + timestamp)
en memoria. El estado se comparte entre todas las partes de la app que
llamen al composable (no persiste al recargar la página).

### API

\`\`\`ts
const { history, addEntry, clear } = useAnalysisHistory()
\`\`\`

| Propiedad | Tipo | Descripción |
|---|---|---|
| `history` | `Ref<AnalysisResult[]>` | Últimos análisis, más reciente primero. Máximo 5 entradas. |
| `addEntry(entry)` | `(entry: AnalysisResult) => void` | Añade una entrada al principio; si se supera el límite, descarta la más antigua. |
| `clear()` | `() => void` | Vacía el historial. |

## Componente: `AnalysisHistory.vue`

Muestra `useAnalysisHistory().history` como lista clicable. Al pulsar una
entrada, emite `select` con el `AnalysisResult` completo para que el padre
pueda recargarlo.

### Eventos

| Evento | Payload | Cuándo se emite |
|---|---|---|
| `select` | `AnalysisResult` | Al pulsar una entrada del historial. |

## Flujo en `App.vue` (actualizado)

Tras un análisis correcto, `App.vue` añade el resultado al historial con
`addEntry`. Al seleccionar una entrada del historial, se restauran tanto
el código en el editor como el resultado mostrado en las tarjetas, sin
volver a llamar a la API.