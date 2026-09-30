import { DEFAULT_LOCALE, isLanguage } from '#shared/utils/languages'
import { translate, type Messages } from '~/utils/i18n'

/**
 * Язык страницы — первый сегмент адреса (/ru/…). Тексты загружает
 * плагин i18n и кладёт в состояние, которое переезжает из серверного
 * рендера в браузер вместе со страницей.
 */
export function useI18n() {
  const route = useRoute()
  // На странице ошибки параметров маршрута нет — язык берётся из пути.
  const locale = computed(() => {
    const segment = route.params.lang ?? route.path.split('/')[1]

    return isLanguage(segment) ? segment : DEFAULT_LOCALE
  })
  const catalog = useState<Record<string, Messages>>('i18n:messages', () => ({}))

  function t(key: string, values: Record<string, string | number> = {}): string {
    return translate(
      catalog.value[locale.value] ?? {},
      catalog.value[DEFAULT_LOCALE] ?? {},
      locale.value,
      key,
      values,
    )
  }

  /** Путь на языке страницы: localePath('/publish') → /ru/publish. */
  function localePath(path: string): string {
    return `/${locale.value}${path === '/' ? '' : path}`
  }

  return { locale, t, localePath }
}
