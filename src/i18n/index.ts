import { createI18n } from 'vue-i18n'
import { es as dfEs, enUS as dfEn } from 'date-fns/locale'
import type { Locale as DateFnsLocale } from 'date-fns'
import { LOCALES, type Locale } from '@/domain/models'
import es from './locales/es.json'
import en from './locales/en.json'

export const DEFAULT_LOCALE: Locale = 'es'

export type MessageSchema = typeof es

export const i18n = createI18n({
  legacy: false,
  locale: DEFAULT_LOCALE as string,
  fallbackLocale: DEFAULT_LOCALE,
  messages: { es, en } satisfies Record<Locale, MessageSchema>,
})

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
}

/** Best guess before the profile is loaded: browser language, else default. */
export function detectLocale(): Locale {
  const lang = typeof navigator === 'undefined' ? '' : navigator.language.slice(0, 2)
  return isLocale(lang) ? lang : DEFAULT_LOCALE
}

export function setLocale(locale: Locale) {
  i18n.global.locale.value = locale
  if (typeof document !== 'undefined') document.documentElement.lang = locale
}

export function currentLocale(): Locale {
  const value = i18n.global.locale.value
  return isLocale(value) ? value : DEFAULT_LOCALE
}

const DATE_FNS_LOCALES: Record<Locale, DateFnsLocale> = { es: dfEs, en: dfEn }

export function dateFnsLocale(): DateFnsLocale {
  return DATE_FNS_LOCALES[currentLocale()]
}
