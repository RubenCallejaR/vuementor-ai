# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/),
y este proyecto sigue [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

## [1.0.0] - 2026-09-12

### Added

- Editor de código embebido (`CodeEditor.vue`) basado en CodeMirror 6, con resaltado de sintaxis para Vue (plantilla + `<script>`/`<script lang="ts">` embebidos) y tema oscuro One Dark. Expone `v-model:code`.
- Endpoint serverless `POST /api/analyze` (función de Vercel) que actúa como proxy a la API de Gemini (`gemini-3.5-flash-lite`), con validación de entrada, límite de tamaño de código y manejo de errores: código inválido, fallo de red, respuesta bloqueada por el filtro de seguridad o JSON malformado.
- Composable `useCodeAnalysis` para gestionar el estado de carga, error y resultado al llamar al endpoint desde el frontend.
- Tarjetas de resultado (`FeedbackCard.vue`) con icono y color propios por categoría: rendimiento, accesibilidad, tipado y buenas prácticas.
- Historial de sesión (`useAnalysisHistory` + `AnalysisHistory.vue`) con los últimos 5 análisis (código, resultado y timestamp), con opción de recargar cualquiera de ellos sin volver a llamar a la API.
- Flujo completo conectado en `App.vue`: editor → botón "Analizar" → tarjetas de resultado → historial de sesión.
- Pipeline de CI (`.github/workflows/ci.yml`) que ejecuta lint, type-check (`vue-tsc`) y tests (Vitest) en cada push y pull request.
- Suite de tests con Vitest y `@vue/test-utils` para el endpoint de análisis, el composable de análisis, el composable de historial y los componentes `CodeEditor` y `FeedbackCard`.
- Documentación en el `README.md` de la API, los composables y los componentes principales.

### Security

- La clave de la API de Gemini (`GEMINI_API_KEY`) vive únicamente en el servidor, como variable de entorno de Vercel; nunca se expone en el bundle del cliente.

[1.0.0]: https://github.com/RubenCallejaR/vuementor-ai/releases/tag/v1.0.0