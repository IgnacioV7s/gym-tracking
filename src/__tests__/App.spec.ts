import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { i18n } from '@/i18n'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn<() => Promise<{ data: { session: null } }>>().mockResolvedValue({
        data: { session: null },
      }),
      onAuthStateChange: vi.fn<() => void>(),
    },
    from: vi.fn<() => void>(),
  },
}))

import App from '../App.vue'

describe('App', () => {
  it('renders the current route and the bottom navigation on private routes', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', name: 'home', component: { template: '<h1>Inicio</h1>' } }],
    })
    await router.push('/')
    await router.isReady()

    const wrapper = mount(App, { global: { plugins: [createPinia(), router, i18n] } })

    expect(wrapper.find('h1').text()).toBe('Inicio')
    expect(wrapper.find('nav').text()).toContain('Historial')
  })

  it('hides the bottom navigation on public routes', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/login', component: { template: '<h1>Login</h1>' }, meta: { public: true } },
      ],
    })
    await router.push('/login')
    await router.isReady()

    const wrapper = mount(App, { global: { plugins: [createPinia(), router, i18n] } })

    expect(wrapper.find('nav').exists()).toBe(false)
  })
})
