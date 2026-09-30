import { IntlMessageFormat } from 'intl-messageformat'
import { DEFAULT_LOCALE } from '#shared/utils/languages'

/**
 * Тексты интерфейса — сообщения ICU.
 *
 * Откуда берутся, по старшинству:
 *   1. файл i18n/locales/{язык}.json в репозитории — переводы, которые
 *      правят люди (готовит их команда бэка i18n:messages);
 *   2. машинный перевод из бэка — для языков, файла которых нет, и для
 *      ключей, которых в файле ещё нет; бэк переводит по первому
 *      посетителю с этим языком;
 *   3. исходный en.json — пока перевода нет.
 * Языки не перечислены в коде: доступен любой, который знает ICU.
 */
export type Messages = { [key: string]: string | Messages }

const files = import.meta.glob<Messages>('../../i18n/locales/*.json', { import: 'default' })

/** Языки, переводы которых лежат в репозитории (их правят люди). */
export const REPO_LOCALES: readonly string[] = Object.keys(files)
  .map(path => path.replace(/^.*\/([^/]+)\.json$/, '$1'))
  .sort()

/** Файл языка из репозитория — лениво: в браузер уходит только нужный. */
export async function loadRepoMessages(locale: string): Promise<Messages | undefined> {
  const loader = files[`../../i18n/locales/${locale}.json`]

  return loader ? await loader() : undefined
}

/** В переводе есть все ключи исходного — дозапрашивать нечего. */
export function coversAll(messages: Messages, source: Messages): boolean {
  return Object.entries(source).every(([key, value]) => {
    const own = messages[key]

    return typeof value === 'string'
      ? typeof own === 'string'
      : typeof own === 'object' && coversAll(own, value)
  })
}

/** Слияние: ключи preferred важнее ключей base. */
export function mergeMessages(base: Messages, preferred: Messages): Messages {
  const result: Messages = { ...base }

  for (const [key, value] of Object.entries(preferred)) {
    const existing = result[key]
    result[key] = typeof value === 'object' && typeof existing === 'object'
      ? mergeMessages(existing, value)
      : value
  }

  return result
}

function lookup(messages: Messages, key: string): string | undefined {
  let node: string | Messages | undefined = messages

  for (const part of key.split('.')) {
    if (typeof node !== 'object' || node === null) {
      return undefined
    }

    node = node[part]
  }

  return typeof node === 'string' ? node : undefined
}

const formatters = new Map<string, IntlMessageFormat>()

/**
 * Текст по ключу на языке страницы; нет ключа в текстах языка — на языке
 * по умолчанию; нет и там — сам ключ, чтобы пропуск был виден, а не пуст.
 */
export function translate(
  messages: Messages,
  fallback: Messages,
  locale: string,
  key: string,
  values: Record<string, string | number> = {},
): string {
  const own = lookup(messages, key)
  const pattern = own ?? lookup(fallback, key)

  if (pattern === undefined) {
    return key
  }

  const formatLocale = own === undefined ? DEFAULT_LOCALE : locale
  const cacheKey = `${formatLocale}\u0000${pattern}`
  let formatter = formatters.get(cacheKey)

  if (formatter === undefined) {
    try {
      formatter = new IntlMessageFormat(pattern, formatLocale)
    }
    catch {
      // Машинный перевод сломал разметку ICU — лучше исходный текст,
      // чем упавшая страница; сломан и он — ключ.
      return own !== undefined ? translate({}, fallback, locale, key, values) : key
    }

    formatters.set(cacheKey, formatter)
  }

  return String(formatter.format(values))
}
