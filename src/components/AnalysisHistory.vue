<script setup lang="ts">
import { useAnalysisHistory } from '@/composables/useAnalysisHistory'
import type { AnalysisResult } from '@/types/analysis'

const emit = defineEmits<{
  (e: 'select', entry: AnalysisResult): void
}>()

const { history, clear } = useAnalysisHistory()

function previewCode(code: string): string {
  const firstLine = code.trim().split('\n')[0] ?? ''
  return firstLine.length > 40 ? `${firstLine.slice(0, 40)}...` : firstLine
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <section class="analysis-history">
    <header class="analysis-history__header">
      <h2>Historial de la sesión</h2>
      <button
        v-if="history.length > 0"
        type="button"
        class="analysis-history__clear"
        @click="clear"
      >
        Limpiar
      </button>
    </header>

    <p v-if="history.length === 0" class="analysis-history__empty">
      Aún no has analizado ningún componente.
    </p>

    <ul v-else class="analysis-history__list">
      <li v-for="entry in history" :key="entry.id">
        <button type="button" class="analysis-history__item" @click="emit('select', entry)">
          <span class="analysis-history__code">{{ previewCode(entry.code) }}</span>
          <span class="analysis-history__time">{{ formatTime(entry.timestamp) }}</span>
        </button>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.analysis-history {
  margin-top: 2rem;
  text-align: left;
}

.analysis-history__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.analysis-history__header h2 {
  margin: 0;
  font-size: 1.1rem;
}

.analysis-history__clear {
  background: none;
  border: none;
  color: #4f46e5;
  cursor: pointer;
  font-size: 0.85rem;
  padding: 0;
}

.analysis-history__empty {
  color: #6b7280;
  font-size: 0.9rem;
}

.analysis-history__list {
  list-style: none;
  margin: 0.75rem 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.analysis-history__item {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background-color: #fff;
  cursor: pointer;
  font-family: inherit;
  text-align: left;
}

.analysis-history__item:hover {
  background-color: #f9fafb;
}

.analysis-history__code {
  font-family: monospace;
  font-size: 0.85rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.analysis-history__time {
  color: #6b7280;
  font-size: 0.8rem;
  flex-shrink: 0;
}
</style>