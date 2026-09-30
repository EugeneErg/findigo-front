import type { PublishAdRequest, Schemas } from '~/types/schema'

/**
 * Черновик объявления в форме — как его видит продавец: всё словами.
 * Сервер сам находит или заводит записи справочников, поэтому форма
 * отправляет имена, а не идентификаторы.
 */
export interface PropertyDraft {
  name: string
  kind: 'number' | 'designation'
  number: string
  unit: string
  designation: string
}

export interface DamageDraft {
  name: string
  number: string
  unit: string
}

export interface IdentifierDraft {
  kind: string
  value: string
}

export interface ComponentDraft {
  category: string
  quantity: number
  damages: DamageDraft[]
  withPart: boolean
  part: { brand: string, partNumber: string, identifiers: IdentifierDraft[] }
  components: ComponentDraft[]
}

export interface TemplateDraft {
  category: string
  brand: string
  model: string
  partNumber: string
  properties: PropertyDraft[]
  mutual: boolean
}

export interface AdDraft {
  category: string
  brand: string
  manufacturer: string
  model: string
  partNumber: string
  /** Ответы на вопросы категории: id свойства → ответ. */
  answers: Record<string, PropertyDraft>
  properties: PropertyDraft[]
  condition: string
  quantity: number
  damages: DamageDraft[]
  identifiers: IdentifierDraft[]
  components: ComponentDraft[]
  fits: TemplateDraft[]
  analogs: TemplateDraft[]
  price: string
  currency: string
  pickupLocationId: string
  onlineOnly: boolean
}

export const emptyProperty = (name = ''): PropertyDraft => ({ name, kind: 'number', number: '', unit: '', designation: '' })
export const emptyDamage = (): DamageDraft => ({ name: '', number: '', unit: '' })
export const emptyIdentifier = (): IdentifierDraft => ({ kind: '', value: '' })
export const emptyComponent = (): ComponentDraft => ({
  category: '',
  quantity: 1,
  damages: [],
  withPart: false,
  part: { brand: '', partNumber: '', identifiers: [] },
  components: [],
})
export const emptyTemplate = (): TemplateDraft => ({ category: '', brand: '', model: '', partNumber: '', properties: [], mutual: true })
export const emptyAd = (currency: string): AdDraft => ({
  category: '',
  brand: '',
  manufacturer: '',
  model: '',
  partNumber: '',
  answers: {},
  properties: [],
  condition: '',
  quantity: 1,
  damages: [],
  identifiers: [],
  components: [],
  fits: [],
  analogs: [],
  price: '',
  currency,
  pickupLocationId: '',
  onlineOnly: true,
})

const text = (value: string): string | undefined => (value.trim() === '' ? undefined : value.trim())

/** «1 234,5» и «1234.5» — одно число; не число — null. */
export function parseNumber(value: string): number | null {
  const normalized = value.replace(/\s/g, '').replace(',', '.')

  if (normalized === '' || !/^-?\d*\.?\d+$/.test(normalized)) {
    return null
  }

  return Number(normalized)
}

type PropertyInput = Schemas['PropertyInput']

function property(draft: PropertyDraft): PropertyInput | null {
  const name = text(draft.name)

  if (name === undefined) {
    return null
  }

  if (draft.kind === 'designation') {
    const designation = text(draft.designation)

    return designation === undefined ? null : { name, designation }
  }

  const number = parseNumber(draft.number)

  return number === null ? null : { name, number, ...(text(draft.unit) ? { unit: text(draft.unit) } : {}) }
}

function properties(drafts: PropertyDraft[]): PropertyInput[] {
  return drafts.map(property).filter((item): item is PropertyInput => item !== null)
}

function damages(drafts: DamageDraft[]): Schemas['ConditionInput'][] {
  return drafts.flatMap((draft) => {
    const name = text(draft.name)
    const number = parseNumber(draft.number)

    if (name === undefined) {
      return []
    }

    return [number === null ? { name } : { name, number, unit: text(draft.unit) ?? '' }]
  })
}

function identifiers(drafts: IdentifierDraft[]): Record<string, string> {
  return Object.fromEntries(
    drafts.flatMap(draft => (text(draft.kind) && text(draft.value) ? [[draft.kind.trim(), draft.value.trim()]] : [])),
  )
}

function components(drafts: ComponentDraft[]): Schemas['ComponentInput'][] {
  return drafts.flatMap((draft) => {
    const category = text(draft.category)

    if (category === undefined) {
      return []
    }

    return [{
      category,
      quantity: Math.max(1, Math.floor(draft.quantity)),
      damages: damages(draft.damages),
      ...(draft.withPart
        ? {
            part: {
              brand: text(draft.part.brand),
              part_number: text(draft.part.partNumber),
              identifiers: identifiers(draft.part.identifiers),
            },
          }
        : {}),
      components: components(draft.components),
    }]
  })
}

function template(draft: TemplateDraft): Schemas['TemplateDraft'] | null {
  const category = text(draft.category)

  if (category === undefined) {
    return null
  }

  return {
    category,
    brand: text(draft.brand),
    model: text(draft.model),
    part_number: text(draft.partNumber),
    properties: properties(draft.properties),
  }
}

/**
 * Черновик → запрос публикации. Цена — в минорных единицах: сколько их
 * в основной, говорит разрядность валюты.
 */
export function toRequest(draft: AdDraft, fractionDigits: number): PublishAdRequest {
  const price = parseNumber(draft.price) ?? 0

  return {
    category: draft.category.trim(),
    brand: text(draft.brand),
    manufacturer: text(draft.manufacturer),
    model: text(draft.model),
    part_number: text(draft.partNumber),
    condition: draft.condition.trim(),
    quantity: Math.max(1, Math.floor(draft.quantity)),
    price: { amount: Math.round(price * 10 ** fractionDigits), currency: draft.currency },
    online_only: draft.onlineOnly,
    ...(draft.pickupLocationId ? { pickup_location_id: draft.pickupLocationId } : {}),
    properties: properties([...Object.values(draft.answers), ...draft.properties]),
    damages: damages(draft.damages),
    identifiers: identifiers(draft.identifiers),
    components: components(draft.components),
    fits: draft.fits.map(template).filter((item): item is Schemas['TemplateDraft'] => item !== null),
    analogs: draft.analogs.flatMap((draft) => {
      const item = template(draft)

      return item === null ? [] : [{ ...item, mutual: draft.mutual }]
    }),
  }
}
