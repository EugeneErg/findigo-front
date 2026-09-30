import { isLanguage } from '#shared/utils/languages'

/**
 * Первый сегмент адреса — язык: любой, который знает ICU. Текстов на нём
 * может ещё не быть — тогда страница по-английски, а перевод заказан.
 * Языка, которого не существует (/xx), нет и у сайта: 404.
 */
export default defineNuxtRouteMiddleware((to) => {
  if (to.path === '/') {
    return
  }

  if (!isLanguage(to.params.lang)) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found', fatal: true })
  }
})
