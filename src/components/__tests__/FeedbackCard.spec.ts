import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FeedbackCard from '../FeedbackCard.vue'
import type { AnalysisCategory } from '@/types/analysis'

describe('FeedbackCard', () => {
  const cases: Array<{ category: AnalysisCategory; label: string }> = [
    { category: 'rendimiento', label: 'Rendimiento' },
    { category: 'accesibilidad', label: 'Accesibilidad' },
    { category: 'tipado', label: 'Tipado' },
    { category: 'buenasPracticas', label: 'Buenas prácticas' },
  ]

  it.each(cases)('muestra el título y las sugerencias para "$category"', ({ category, label }) => {
    const suggestions = ['Primera observación', 'Segunda observación']
    const wrapper = mount(FeedbackCard, { props: { category, suggestions } })

    expect(wrapper.text()).toContain(label)

    const items = wrapper.findAll('li')
    expect(items).toHaveLength(2)
    expect(items[0]!.text()).toBe('Primera observación')
    expect(items[1]!.text()).toBe('Segunda observación')

    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('muestra un mensaje cuando no hay sugerencias', () => {
    const wrapper = mount(FeedbackCard, {
      props: { category: 'rendimiento', suggestions: [] },
    })

    expect(wrapper.find('ul').exists()).toBe(false)
    expect(wrapper.text()).toContain('Sin observaciones para esta categoría.')
  })

  it('usa un color de borde distinto para cada categoría', () => {
    const seen = new Set<string>()

    for (const { category } of cases) {
      const wrapper = mount(FeedbackCard, { props: { category, suggestions: [] } })
      const borderColor = (wrapper.element as HTMLElement).style.borderColor
      expect(borderColor).not.toBe('')
      seen.add(borderColor)
    }

    expect(seen.size).toBe(cases.length)
  })
})