/**
 * Посетитель страницы: страна и язык — в контекст запроса (корень
 * сайта ведёт на язык посетителя), и раз за сессию — визит в бэк.
 *
 * Бэк хранит только счётчик «день × страна × язык»; язык, на котором
 * интерфейса ещё нет, он тут же ставит в очередь на перевод.
 */
const COOKIE = 'findigo_visit'
// Роботы cookie не хранят и считались бы визитом на каждой странице.
const ROBOT = /bot|crawl|spider|slurp|facebookexternalhit|preview|headless/i

export default defineEventHandler(async (event) => {
  if (event.method !== 'GET' || !(getRequestHeader(event, 'accept') ?? '').includes('text/html')) {
    return
  }

  const path = event.path
  if (path.startsWith('/_') || path.startsWith('/api/') || /\.[a-z0-9]+(\?|$)/i.test(path)) {
    return
  }

  const country = await visitorCountry(event)
  const lang = visitorLanguage(getRequestHeader(event, 'accept-language') ?? '', country, DEFAULT_LOCALE)
  event.context.visitor = { country, lang } satisfies Visitor

  const config = useRuntimeConfig(event)
  if (!config.internalToken || getCookie(event, COOKIE) || ROBOT.test(getRequestHeader(event, 'user-agent') ?? '')) {
    return
  }

  // Сессионная cookie: закрыл браузер — следующий заход новый визит.
  setCookie(event, COOKIE, '1', { httpOnly: true, sameSite: 'lax', path: '/' })

  // Страницу визит не задерживает: бэк недоступен — визит потерян, и только.
  void $fetch('/internal/visits', {
    baseURL: config.apiBase,
    method: 'POST',
    headers: { 'X-Internal-Token': config.internalToken },
    body: { country, lang },
    timeout: 2000,
  }).catch((error: unknown) => console.warn('Визит не записан', error))
})
