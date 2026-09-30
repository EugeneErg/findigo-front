/**
 * Языки посетителя — общее для страниц и сервера фронта.
 *
 * Сайт доступен на любом языке, который знает ICU (CLDR): список не
 * хранится в коде, язык проверяется данными Intl. В адресе — только
 * язык без региона: /pt, а не /pt-br.
 */
const LANGUAGE = /^[a-z]{2,3}$/

/** Язык по умолчанию и язык исходного файла текстов (en.json). */
export const DEFAULT_LOCALE = 'en'

/**
 * Язык существует: у него есть имя и известная письменность. Так
 * отсекаются «xx» и служебные коды ISO (und, mul, zxx) — без списка.
 */
export function isLanguage(value: unknown): value is string {
  if (typeof value !== 'string' || !LANGUAGE.test(value)) {
    return false
  }

  try {
    const name = new Intl.DisplayNames(['en'], { type: 'language', fallback: 'none' }).of(value)
    const likely = new Intl.Locale(value).maximize()

    return name !== undefined && likely.language === value && likely.script !== undefined
  }
  catch {
    return false
  }
}

/** Языки из Accept-Language по убыванию веса, без регионов и повторов. */
export function acceptedLanguages(header: string): string[] {
  const weighted = header
    .split(',')
    .map((part, index) => {
      const [tag = '', ...params] = part.trim().split(';')
      const q = params.map(param => param.trim()).find(param => param.startsWith('q='))
      const weight = q === undefined ? 1 : Number.parseFloat(q.slice(2))

      return { lang: tag.trim().toLowerCase().split('-')[0] ?? '', weight: Number.isNaN(weight) ? 0 : weight, index }
    })
    .filter(item => item.weight > 0 && isLanguage(item.lang))
    .sort((a, b) => b.weight - a.weight || a.index - b.index)

  return [...new Set(weighted.map(item => item.lang))]
}

/** Самый вероятный язык страны (CLDR likely subtags): DE → de, BR → pt. */
export function likelyLanguage(country: string | null): string | undefined {
  if (country === null || !/^[A-Z]{2}$/.test(country)) {
    return undefined
  }

  try {
    const language = new Intl.Locale(`und-${country}`).maximize().language

    return isLanguage(language) ? language : undefined
  }
  catch {
    return undefined
  }
}

/**
 * Язык посетителя: первый из его предпочтений браузера; браузер
 * не сказал — вероятный язык страны; не знаем и её — по умолчанию.
 */
export function visitorLanguage(acceptLanguage: string, country: string | null, fallback: string): string {
  return acceptedLanguages(acceptLanguage)[0] ?? likelyLanguage(country) ?? fallback
}

/**
 * Посетитель, каким его определил сервер фронта: страна по IP (null —
 * неизвестна) и язык. Лежит в контексте запроса (event.context.visitor).
 */
export interface Visitor {
  country: string | null
  lang: string
}

/** Посетитель из контекста запроса — с проверкой формы. */
export function visitorOf(context: Record<string, unknown> | undefined): Visitor | undefined {
  const value: unknown = context?.visitor

  if (typeof value !== 'object' || value === null || !('lang' in value) || !('country' in value)) {
    return undefined
  }

  const { lang, country } = value

  return isLanguage(lang) && (country === null || typeof country === 'string') ? { lang, country } : undefined
}
