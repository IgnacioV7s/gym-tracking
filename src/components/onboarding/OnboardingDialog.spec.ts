import { describe, it, expect } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { i18n } from '@/i18n'
import OnboardingDialog from './OnboardingDialog.vue'

async function mountDialog() {
  const wrapper = mount(OnboardingDialog, {
    props: { open: true },
    global: { plugins: [i18n] },
    attachTo: document.body,
  })
  await flushPromises()
  await new Promise((r) => setTimeout(r, 0))
  return wrapper
}

describe('OnboardingDialog', () => {
  it('walks through the steps and emits finish on the last one', async () => {
    const wrapper = await mountDialog()
    const buttons = () => Array.from(document.body.querySelectorAll('button'))
    const next = () => buttons().find((b) => b.textContent?.trim() === 'Siguiente')

    expect(document.body.textContent).toContain('Paso 1 de 4')
    next()!.click()
    await wrapper.vm.$nextTick()
    expect(document.body.textContent).toContain('Paso 2 de 4')
    next()!.click()
    next()!.click()
    await wrapper.vm.$nextTick()
    expect(document.body.textContent).toContain('Paso 4 de 4')

    const done = buttons().find((b) => b.textContent?.trim() === '¡A entrenar!')
    done!.click()
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('finish')).toHaveLength(1)
    expect(wrapper.emitted('update:open')?.[0]).toEqual([false])
    wrapper.unmount()
  })

  it('emits finish when skipped', async () => {
    const wrapper = await mountDialog()
    const skip = Array.from(document.body.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Omitir',
    )
    skip!.click()
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('finish')).toHaveLength(1)
    wrapper.unmount()
  })
})
