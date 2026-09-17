import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'

import App from '../App.vue'
import HomeView from '@/views/HomeView.vue'

describe('App', () => {
  it('renders the home view and the bottom navigation', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: HomeView }],
    })
    await router.push('/')
    await router.isReady()

    const wrapper = mount(App, { global: { plugins: [router] } })

    expect(wrapper.find('h1').text()).toBe('Inicio')
    expect(wrapper.find('nav').text()).toContain('Historial')
  })
})
