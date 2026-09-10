<!-- src/components/CodeEditor.vue -->
<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import { EditorView, basicSetup } from 'codemirror'
import { html } from '@codemirror/lang-html'
import { vue as vueLang } from '@codemirror/lang-vue'
import { typescriptLanguage } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'

const props = defineProps<{
  /** Contenido inicial/controlado del editor. */
  code: string
}>()

const emit = defineEmits<{
  (e: 'update:code', value: string): void
}>()

const editorContainer = ref<HTMLDivElement | null>(null)
const view = shallowRef<EditorView | null>(null)

// Vue (plantilla) como lenguaje base, usando HTML como parser subyacente.
// Se configura para que el contenido de <script lang="ts"> se resalte
// como TypeScript; sin lang (o lang="js") cae en el JS por defecto de lang-html.
const vueLanguageSupport = vueLang({
  base: html({
    nestedLanguages: [
      {
        tag: 'script',
        attrs: (attrs) => attrs.lang === 'ts' || attrs.lang === 'tsx',
        parser: typescriptLanguage.parser,
      },
    ],
  }),
})

onMounted(() => {
  if (!editorContainer.value) return

  view.value = new EditorView({
    parent: editorContainer.value,
    doc: props.code,
    extensions: [
      basicSetup,
      vueLanguageSupport,
      oneDark,
      EditorView.lineWrapping,
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          emit('update:code', update.state.doc.toString())
        }
      }),
    ],
  })
})

onBeforeUnmount(() => {
  view.value?.destroy()
  view.value = null
})

// Sincroniza el editor si el padre cambia `code` desde fuera
// (p. ej. al cargar un ejemplo o limpiar el editor).
watch(
  () => props.code,
  (newCode) => {
    const currentView = view.value
    if (!currentView) return

    const currentCode = currentView.state.doc.toString()
    if (newCode !== currentCode) {
      currentView.dispatch({
        changes: { from: 0, to: currentView.state.doc.length, insert: newCode },
      })
    }
  },
)

// Expuesto para tests (acceso directo al EditorView) y para casos como .focus().
defineExpose({ view })
</script>

<template>
  <div ref="editorContainer" class="code-editor" />
</template>

<style scoped>
.code-editor {
  border-radius: 6px;
  overflow: hidden;
  text-align: left;
}

.code-editor :deep(.cm-editor) {
  height: 100%;
}
</style>