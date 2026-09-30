<script setup lang="ts">
import type { AdCard } from '~/types/schema'
import { adNumberOf, adPath, formatMoney, templateTitle } from '~/utils/format'

/**
 * Страница объявления: /ru/legkovyye-avtomobili-toyota-camry-12.
 *
 * Страница находится по номеру (D17 б); слова вокруг него — для человека
 * и поисковика и меняются вместе с названием. Пришли по старым словам
 * или без них — постоянный переезд на текущие.
 */
const route = useRoute()
const { t, locale } = useI18n()
const api = useApi()

const number = adNumberOf(String(route.params.page))

if (number === null) {
  throw createError({ statusCode: 404, statusMessage: 'Not Found', fatal: true })
}

const { data: ad } = await useAsyncData(`ad:${locale.value}:${number}`, () => api<AdCard>(`/ads/by-number/${number}`))

if (!ad.value) {
  throw createError({ statusCode: 404, statusMessage: 'Not Found', fatal: true })
}

const canonical = adPath(locale.value, ad.value.slug, ad.value.number)

if (route.path !== canonical) {
  await navigateTo(canonical, { redirectCode: 301, replace: true })
}

const item = computed(() => ad.value?.items[0] ?? null)
const template = computed(() => item.value?.template ?? null)
const thing = computed(() => item.value?.thing ?? null)
const title = computed(() => (template.value ? templateTitle(template.value) : t('ad.untitled')))
const price = computed(() => (ad.value?.price ? formatMoney(ad.value.price, locale.value) : null))
const config = useRequestURL()

useSeoMeta({
  title: () => [title.value, price.value].filter(Boolean).join(' — '),
  description: () => [title.value, thing.value?.condition.name, price.value].filter(Boolean).join(', '),
  ogTitle: () => title.value,
  ogType: 'website',
  ogUrl: () => `${config.origin}${canonical}`,
})
useHead({ link: [{ rel: 'canonical', href: `${config.origin}${canonical}` }] })
</script>

<template>
  <article v-if="ad" class="ad">
    <header class="head">
      <h1>{{ title }}</h1>
      <p v-if="price" class="price">
        {{ price }}
      </p>
      <p v-if="ad.status !== 'active'" class="status">
        {{ t(`ad.status.${ad.status}`) }}
      </p>
    </header>

    <div class="columns">
      <div class="main">
        <section v-if="thing" class="block">
          <h2>{{ t('ad.condition') }}</h2>
          <p>{{ thing.condition.name }}</p>
          <DamageList :damages="thing.damages" />
          <p v-for="identifier in thing.identifiers" :key="identifier.kind.id" class="identifier">
            {{ identifier.kind.name }}: {{ identifier.value ?? t('ad.identifierHidden') }}
          </p>
        </section>

        <section v-if="template && template.properties.length > 0" class="block">
          <h2>{{ t('ad.properties') }}</h2>
          <PropertyList :properties="template.properties" />
        </section>

        <section v-if="thing && thing.components.length > 0" class="block">
          <h2>{{ t('ad.configuration') }}</h2>
          <ComponentTree :components="thing.components" />
        </section>

        <section v-if="template" class="block">
          <LinkedTemplates :title="t('ad.fits')" :templates="template.links.fits" linked />
          <LinkedTemplates :title="t('ad.replaces')" :templates="template.links.replaces" linked />
          <LinkedTemplates :title="t('ad.replacedBy')" :templates="template.links.replaced_by" linked />
        </section>
      </div>

      <aside class="side">
        <section class="block">
          <h2>{{ t('ad.seller') }}</h2>
          <p>{{ ad.seller.name }}</p>
          <ContactList :contacts="ad.seller.contacts" />
          <template v-if="ad.responsible">
            <p class="responsible">
              {{ t('ad.responsible', { name: ad.responsible.name }) }}
            </p>
            <ContactList :contacts="ad.responsible.contacts" />
          </template>
        </section>
        <section class="block">
          <h2>{{ t('ad.pickup') }}</h2>
          <p v-if="ad.pickup">
            {{ ad.pickup.title }}<br>{{ ad.pickup.address }}
          </p>
          <p v-if="ad.online_only">
            {{ t('ad.onlineOnly') }}
          </p>
        </section>
      </aside>
    </div>
  </article>
</template>

<style scoped>
.head h1 {
  margin: 0 0 8px;
}

.price {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

.status {
  color: #8a5a00;
}

.columns {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 32px;
  margin-top: 24px;
}

@media (max-width: 760px) {
  .columns {
    grid-template-columns: 1fr;
  }
}

.block {
  margin-bottom: 24px;
}

.block h2 {
  font-size: 1.1rem;
  margin: 0 0 8px;
}

.identifier,
.responsible {
  color: var(--muted);
}
</style>
