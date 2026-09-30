import { DEFAULT_LOCALE, isLanguage } from '#shared/utils/languages'
import { coversAll, loadRepoMessages, mergeMessages, type Messages } from '~/utils/i18n'

interface Catalog {
  status: 'pending' | 'ready' | 'failed'
  messages: Messages | null
}

/**
 * Тексты языка страницы и языка по умолчанию — до рендера: на сервере
 * для первой страницы, в браузере — при переходе на другой язык.
 *
 * Файл из репозитория — главный; чего в нём нет (или нет его самого) —
 * машинный перевод из бэка. Бэка нет или перевода ещё нет — по-английски.
 */
export default defineNuxtPlugin(async () => {
  const catalog = useState<Record<string, Messages>>('i18n:messages', () => ({}))
  const config = useRuntimeConfig()
  const baseURL = import.meta.server ? config.apiBase : config.public.apiBase

  async function machine(locale: string): Promise<Messages> {
    try {
      const found = await $fetch<Catalog>(`/i18n/web/${locale}`, { baseURL, timeout: 3000 })

      return found.messages ?? {}
    }
    catch {
      return {}
    }
  }

  async function ensure(locale: string): Promise<void> {
    if (catalog.value[locale] !== undefined) {
      return
    }

    const file = await loadRepoMessages(locale)
    const source = catalog.value[DEFAULT_LOCALE] ?? {}
    const messages = locale === DEFAULT_LOCALE || (file !== undefined && coversAll(file, source))
      ? (file ?? {})
      : mergeMessages(await machine(locale), file ?? {})

    catalog.value = { ...catalog.value, [locale]: messages }
  }

  const router = useRouter()
  const current = router.currentRoute.value.params.lang ?? router.currentRoute.value.path.split('/')[1]
  await ensure(DEFAULT_LOCALE)

  if (isLanguage(current)) {
    await ensure(current)
  }

  router.beforeResolve(async (to) => {
    if (isLanguage(to.params.lang)) {
      await ensure(to.params.lang)
    }
  })
})
