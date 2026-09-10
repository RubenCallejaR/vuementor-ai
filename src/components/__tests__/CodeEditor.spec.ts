import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { EditorView } from 'codemirror'
import CodeEditor from '../CodeEditor.vue'

// jsdom no implementa completamente las APIs de medición de texto que usa
// CodeMirror 6 (Range.getClientRects / getBoundingClientRect). Estos stubs
// son un parche defensivo para evitar fallos según la versión de jsdom.
beforeEach(() => {
  // @ts-expect-error – parche mínimo de jsdom para CodeMirror
  Range.prototype.getClientRects = () => []
  // @ts-expect-error – parche mínimo de jsdom para CodeMirror
  Range.prototype.getBoundingClientRect = () => ({
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 0,
    height: 0,
  })
})

describe('CodeEditor', () => {
  it('emite "update:code" con el contenido actual cuando el documento cambia', async () => {
    const wrapper = mount(CodeEditor, {
      props: { code: 'const x = 1' },
      attachTo: document.body,
    })

    const view = (wrapper.vm as unknown as { view: EditorView }).view
    expect(view).toBeInstanceOf(EditorView)

    // Simula una edición despachando una transacción directamente sobre
    // el EditorView, que es como CodeMirror notifica los cambios internamente.
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: 'const x = 2' },
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('update:code')).toBeTruthy()
    expect(wrapper.emitted('update:code')?.[0]).toEqual(['const x = 2'])

    wrapper.unmount()
  })

  it('no emite "update:code" al montar, solo cuando cambia el contenido', () => {
    const wrapper = mount(CodeEditor, {
      props: { code: 'const x = 1' },
      attachTo: document.body,
    })

    expect(wrapper.emitted('update:code')).toBeUndefined()

    wrapper.unmount()
  })
})