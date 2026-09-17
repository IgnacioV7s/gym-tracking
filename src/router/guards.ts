import type { Router } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

declare module 'vue-router' {
  interface RouteMeta {
    /** Route needs a signed-in user. Defaults to true; set false for public routes. */
    public?: boolean
  }
}

export function installAuthGuard(router: Router) {
  router.beforeEach(async (to) => {
    const auth = useAuthStore()
    await auth.init()

    if (to.meta.public) {
      // Signed-in users skip the auth pages.
      return auth.isAuthenticated && to.name?.toString().startsWith('auth-')
        ? { name: 'home' }
        : true
    }
    if (!auth.isAuthenticated) {
      return { name: 'auth-login', query: { redirect: to.fullPath } }
    }
    return true
  })
}
