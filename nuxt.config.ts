import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  // SSR включён намеренно и выключению не подлежит: карточки объявлений
  // живут органическим поиском. Яндекс исполняет JS «на усмотрение робота»
  // и сам рекомендует SSR, Google рендерит с задержкой в недели, а краулеры
  // соцсетей и ИИ-поисковиков не исполняют его вовсе.
  ssr: true,

  modules: ['@nuxt/eslint'],

  // Компоненты — по имени файла, без префикса папки: <SuggestInput>,
  // а не <FormSuggestInput>.
  components: [{ path: '~/components', pathPrefix: false }],

  typescript: {
    strict: true,
    typeCheck: true,
  },

  runtimeConfig: {
    // Серверный рендер ходит в API внутренним адресом, минуя интернет.
    apiBase: 'http://127.0.0.1:8000/api',
    // Общий секрет служебных вызовов бэка (визиты, исходный файл текстов):
    // тот же INTERNAL_TOKEN, что у бэка. Пусто — визиты не шлются.
    internalToken: '',
    // Страна посетителя: заголовок CDN (Cloudflare — CF-IPCountry),
    // иначе база GeoIP (MaxMind GeoLite2 Country, .mmdb), если путь задан.
    countryHeader: 'cf-ipcountry',
    geoipDatabase: '',
    // IP из X-Forwarded-For — только за своим прокси, иначе его подделают.
    trustForwardedFor: false,
    public: {
      // Браузер — публичным.
      apiBase: 'http://localhost:8000/api',
      // Временно, до входа (этап 4): организация, от имени которой
      // публикует форма. Только для разработки: бэк в проде заголовок
      // не принимает.
      devOrganizationId: '',
    },
  },

  app: {
    head: {
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
    },
  },

  compatibilityDate: '2026-09-25',
})
