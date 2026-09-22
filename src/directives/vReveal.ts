import type { Directive } from 'vue'
import { revealList } from '@/lib/motion'

/**
 * `v-reveal` fades a container's children in with a stagger the first time
 * they render. The binding value is an optional start delay in ms.
 */
export const vReveal: Directive<HTMLElement, number | undefined> = {
  mounted(el, binding) {
    const children = el.children.length ? Array.from(el.children) : [el]
    revealList(children as HTMLElement[], { delay: binding.value ?? 0 })
  },
}
