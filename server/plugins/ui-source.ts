import source from '../../i18n/locales/en.json'

/**
 * При старте — исходный файл текстов интерфейса в бэк: с него он
 * переводит интерфейс на языки посетителей, для которых файла в
 * репозитории нет. Изменился файл — бэк переведёт заново только
 * изменившееся. Бэк ещё не поднялся — несколько попыток, старт не ждёт.
 */
const ATTEMPTS = 5
const PAUSE_MS = 5000

export default defineNitroPlugin(() => {
  const config = useRuntimeConfig()

  if (!config.internalToken) {
    return
  }

  const register = async (attempt: number): Promise<void> => {
    try {
      await $fetch('/internal/i18n/sources/web', {
        baseURL: config.apiBase,
        method: 'PUT',
        query: { lang: 'en' },
        headers: { 'X-Internal-Token': config.internalToken },
        body: source,
      })
    }
    catch (error) {
      if (attempt < ATTEMPTS) {
        setTimeout(() => void register(attempt + 1), PAUSE_MS)
      }
      else {
        console.warn('Исходный файл текстов не зарегистрирован в бэке', error)
      }
    }
  }

  void register(1)
})
