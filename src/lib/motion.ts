import { animate, createTimeline, stagger, utils } from 'animejs'

/** Durations in ms. Short enough to never delay a tap between sets. */
export const DURATION = { fast: 160, base: 260, slow: 420 } as const
export const EASE = {
  out: 'outQuad',
  spring: 'outBack(1.4)',
  inOut: 'inOutQuad',
} as const

/** Users who asked the OS for less motion get the end state with no animation. */
export function prefersReducedMotion(): boolean {
  return typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
}

type Targets = Parameters<typeof animate>[0]
type Params = Parameters<typeof animate>[1]

/** animate() that becomes an instant apply when reduced motion is on. */
export function motion(targets: Targets, params: Params) {
  if (prefersReducedMotion()) {
    const {
      duration: _d,
      delay: _de,
      ease: _e,
      onComplete,
      ...values
    } = params as Record<string, unknown> & { onComplete?: () => void }
    const final: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(values)) {
      final[key] = Array.isArray(value) ? value.at(-1) : value
    }
    utils.set(targets, final as Params)
    onComplete?.()
    return null
  }
  return animate(targets, params)
}

/** Pop used when a set is completed: quick scale up and settle. */
export function popIn(target: Targets) {
  return motion(target, {
    scale: [1, 1.06, 1],
    duration: DURATION.base,
    ease: EASE.out,
  })
}

/** Entrance for list items, staggered by index. */
export function revealList(targets: Targets, { delay = 0 } = {}) {
  return motion(targets, {
    opacity: [0, 1],
    translateY: [8, 0],
    duration: DURATION.base,
    delay: prefersReducedMotion() ? 0 : stagger(40, { start: delay }),
    ease: EASE.out,
  })
}

/** Counts a number up, writing into the element's text. `format` renders each step. */
export function countUp(
  el: HTMLElement,
  to: number,
  {
    from = 0,
    format = (v: number) => String(Math.round(v)),
    duration = DURATION.slow as number,
  }: { from?: number; format?: (v: number) => string; duration?: number } = {},
) {
  if (prefersReducedMotion()) {
    el.textContent = format(to)
    return null
  }
  const state = { value: from }
  return animate(state, {
    value: to,
    duration,
    ease: EASE.out,
    onUpdate: () => {
      el.textContent = format(state.value)
    },
    onComplete: () => {
      el.textContent = format(to)
    },
  })
}

export { animate, createTimeline, stagger, utils }
