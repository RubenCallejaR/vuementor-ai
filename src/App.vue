<script setup lang="ts">
import CodeEditor from '@/components/CodeEditor.vue'
import FeedbackCard from '@/components/FeedbackCard.vue'
import { useCodeAnalysis } from '@/composables/useCodeAnalysis'
import type { AnalysisCategory } from '@/types/analysis'
import { ref } from 'vue'

const CATEGORY_ORDER: AnalysisCategory[] = [
  'rendimiento',
  'accesibilidad',
  'tipado',
  'buenasPracticas',
]

const code = ref('')
const { isLoading, error, result, analyzeCode } = useCodeAnalysis()

function handleAnalyze() {
  if (!code.value.trim() || isLoading.value) return
  analyzeCode(code.value)
}
</script>

<template>
  <div id="app-root">
    <header class="app-header">
      <h1>VueMentor AI</h1>
      <p>Pega un componente Vue y recibe feedback de code review al instante.</p>
    </header>

    <CodeEditor v-model:code="code" />

    <button class="analyze-button" :disabled="isLoading || !code.trim()" @click="handleAnalyze">
      {{ isLoading ? 'Analizando...' : 'Analizar' }}
    </button>

    <p v-if="error" class="error-message" role="alert">{{ error }}</p>

    <section v-if="result" class="results-grid">
      <FeedbackCard
        v-for="category in CATEGORY_ORDER"
        :key="category"
        :category="category"
        :suggestions="result.feedback[category]"
      />
    </section>
  </div>
</template>

<style scoped>
.app-header {
  margin-bottom: 1.5rem;
}

.app-header h1 {
  margin: 0 0 0.25rem;
}

.app-header p {
  margin: 0;
  color: #6b7280;
}

.analyze-button {
  margin-top: 1rem;
  padding: 0.6rem 1.25rem;
  border: none;
  border-radius: 6px;
  background-color: #4f46e5;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}

.analyze-button:disabled {
  background-color: #a5b4fc;
  cursor: not-allowed;
}

.error-message {
  margin-top: 1rem;
  color: #b91c1c;
}

.results-grid {
  margin-top: 1.5rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1rem;
}
</style>