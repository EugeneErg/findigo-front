import type { Schemas, TemplateView } from '~/types/schema'

/**
 * Деньги приходят в минорных единицах. Сколько их в основной, знает ICU
 * (иена — 0, рубль — 2, динар — 3), а не таблица в коде.
 */
export function formatMoney(money: Schemas['Money'], locale: string): string {
  const format = new Intl.NumberFormat(locale, { style: 'currency', currency: money.currency })
  const digits = format.resolvedOptions().maximumFractionDigits ?? 2

  return format.format(money.amount / 10 ** digits)
}

/**
 * Число свойства. Разряды — только от пяти цифр (min2): «12 500 мм»,
 * но «2015» — год выпуска с пробелом внутри читается как опечатка.
 */
export function formatNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 6, useGrouping: 'min2' }).format(value)
}

/** Название шаблона: категория, бренд, модель; нет модели — артикул. */
export function templateTitle(template: TemplateView): string {
  return [template.category.name, template.brand?.name, template.model?.name ?? template.part_number]
    .filter((part): part is string => typeof part === 'string' && part !== '')
    .join(' ')
}

/** Значение свойства для показа: число с единицей, значение из списка или да/нет. */
export function propertyValue(
  property: TemplateView['properties'][number],
  locale: string,
  yesNo: (flag: boolean) => string,
): string {
  if (property.number !== null) {
    return [formatNumber(property.number, locale), property.unit?.name].filter(Boolean).join(' ')
  }

  if (property.value !== null) {
    return property.value.name
  }

  if (property.flag !== null) {
    return yesNo(property.flag)
  }

  return property.raw ?? ''
}

/** Путь страницы объявления: /ru/slova-nazvaniya-12 (D17 б). */
export function adPath(locale: string, slug: string, number: number): string {
  return `/${locale}/${slug === '' ? '' : `${slug}-`}${number}`
}

/** Номер из последнего сегмента адреса: «…-12» или «12». */
export function adNumberOf(segment: string): number | null {
  const match = /(?:^|-)(\d{1,18})$/.exec(segment)

  return match?.[1] === undefined ? null : Number(match[1])
}
