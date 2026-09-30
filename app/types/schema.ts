import type { components } from './api'

/**
 * Схемы ответов API — из OpenAPI бэка (npm run api:types). Контракт
 * один: поменялся — типы фронта поменялись вместе с ним.
 */
export type Schemas = components['schemas']
export type AdCard = Schemas['AdCard']
export type TemplateCard = Schemas['TemplateCard']
export type TemplateView = Schemas['TemplateView']
export type ThingView = Schemas['ThingView']
export type ComponentView = Schemas['ComponentView']
export type NamedEntry = Schemas['NamedEntry']
export type Suggestion = Schemas['Suggestion']
export type CategoryProperty = Schemas['CategoryProperty']
export type PublishAdRequest = Schemas['PublishAdRequest']
export type PublishedAd = Schemas['PublishedAd']
export type Location = Schemas['Location']
export type GroupMember = Schemas['GroupMember']
