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
    {
      path: '/history/:id',
      name: 'workout-detail',
      component: () => import('@/views/WorkoutDetailView.vue'),
    },
    { path: '/routines', name: 'routines', component: () => import('@/views/RoutinesView.vue') },
    {
      path: '/routines/new',
      name: 'routine-new',
      component: () => import('@/views/RoutineEditView.vue'),
    },
    {
      path: '/routines/:id/edit',
      name: 'routine-edit',
      component: () => import('@/views/RoutineEditView.vue'),
    },
    { path: '/analytics', name: 'analytics', component: () => import('@/views/AnalyticsView.vue') },
    { path: '/settings', name: 'settings', component: () => import('@/views/SettingsView.vue') },
    { path: '/exercises', name: 'exercises', component: () => import('@/views/ExercisesView.vue') },
    {
      path: '/exercises/:id',
      name: 'exercise-detail',
      component: () => import('@/views/ExerciseDetailView.vue'),
    },
    { path: '/workout', name: 'workout', component: () => import('@/views/WorkoutView.vue') },
  ],
})

installAuthGuard(router)

export default router
