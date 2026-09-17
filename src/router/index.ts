import { createRouter, createWebHistory } from 'vue-router'
import { installAuthGuard } from './guards'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'auth-login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/register',
      name: 'auth-register',
      component: () => import('@/views/auth/RegisterView.vue'),
      meta: { public: true },
    },
    { path: '/', name: 'home', component: () => import('@/views/HomeView.vue') },
    { path: '/history', name: 'history', component: () => import('@/views/HistoryView.vue') },
    { path: '/routines', name: 'routines', component: () => import('@/views/RoutinesView.vue') },
    { path: '/analytics', name: 'analytics', component: () => import('@/views/AnalyticsView.vue') },
    { path: '/settings', name: 'settings', component: () => import('@/views/SettingsView.vue') },
  ],
})

installAuthGuard(router)

export default router
