import { isLanguage } from '#shared/utils/languages'

/**
 * Единственная дверь в API.
 *
 * Компоненты не ходят в бэк напрямую: иначе базовый адрес, язык
 * и обработка ошибок расползутся по страницам, и первая же смена
 * контракта станет правкой в двадцати местах.
 */
export function useApi() {
  const config = useRuntimeConfig()
  const route = useRoute()
  // На сервере — внутренний адрес, в браузере — публичный.
  const baseURL = import.meta.server ? config.apiBase : config.public.apiBase
  const lang = isLanguage(route.params.lang) ? route.params.lang : undefined
  const organization = config.public.devOrganizationId

  return $fetch.create({
    baseURL,
    headers: {
      'Accept': 'application/json',
      // Временно, до входа (этап 4): от имени какой организации.
      // Бэк принимает заголовок только вне прода.
      ...(organization ? { 'X-Organization-Id': organization } : {}),
    },
    onRequest({ options }) {
      // Язык показа имён из справочников — у каждого запроса на чтение.
      if (lang !== undefined && (options.method ?? 'GET').toUpperCase() === 'GET') {
        options.query = { lang, ...options.query }
      }
    },
    onResponseError({ response }) {
      if (response.status === 422) {
        // Ошибки валидации — часть нормального потока формы,
        // а не сбой: их разбирает вызывающая страница.
        return
      }

      throw createError({
        statusCode: response.status,
        statusMessage: response.statusText,
        fatal: response.status >= 500,
      })
    },
  })
}
