<script setup lang="ts">
import { computed } from 'vue'
import type { AnalysisCategory } from '@/types/analysis'

const props = defineProps<{
  category: AnalysisCategory
  suggestions: string[]
}>()

interface CategoryMeta {
  label: string
  color: string
  backgroundColor: string
}

const CATEGORY_META: Record<AnalysisCategory, CategoryMeta> = {
  rendimiento: { label: 'Rendimiento', color: '#b45309', backgroundColor: '#fef3c7' },
  accesibilidad: { label: 'Accesibilidad', color: '#1d4ed8', backgroundColor: '#dbeafe' },
  tipado: { label: 'Tipado', color: '#6d28d9', backgroundColor: '#ede9fe' },
  buenasPracticas: { label: 'Buenas prácticas', color: '#047857', backgroundColor: '#d1fae5' },
}

const meta = computed(() => CATEGORY_META[props.category])
</script>

<template>
  <article class="feedback-card" :style="{ borderColor: meta.color }">
    <header
      class="feedback-card__header"
      :style="{ backgroundColor: meta.backgroundColor, color: meta.color }"
    >
      <span class="feedback-card__icon" aria-hidden="true">
        <svg
          v-if="category === 'rendimiento'"
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="currentColor"
        >
          <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
        </svg>
        <svg
          v-else-if="category === 'accesibilidad'"
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        <svg
          v-else-if="category === 'tipado'"
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M9 4c-2 0-3 1-3 3v3c0 1-1 2-2 2 1 0 2 1 2 2v3c0 2 1 3 3 3" />
          <path d="M15 4c2 0 3 1 3 3v3c0 1 1 2 2 2-1 0-2 1-2 2v3c0 2-1 3-3 3" />
        </svg>
        <svg
          v-else
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="m20 6-11 11-5-5" />
        </svg>
      </span>
      <h3 class="feedback-card__title">{{ meta.label }}</h3>
    </header>

    <p v-if="suggestions.length === 0" class="feedback-card__empty">
      Sin observaciones para esta categoría.
    </p>
    <ul v-else class="feedback-card__list">
      <li v-for="(suggestion, index) in suggestions" :key="index">
        {{ suggestion }}
      </li>
    </ul>
  </article>
</template>

<style scoped>
.feedback-card {
  border: 1px solid #e5e7eb;
  border-left-width: 4px;
  border-radius: 8px;
  overflow: hidden;
  background-color: #fff;
  text-align: left;
}

.feedback-card__header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
}

.feedback-card__icon {
  display: inline-flex;
}

.feedback-card__title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.feedback-card__empty {
  margin: 0;
  padding: 1rem;
  color: #6b7280;
  font-size: 0.9rem;
}

.feedback-card__list {
  margin: 0;
  padding: 0.75rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #374151;
}
</style>