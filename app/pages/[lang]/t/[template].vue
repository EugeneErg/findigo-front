<script setup lang="ts">
import type { TemplateCard } from '~/types/schema'
import { templateTitle } from '~/utils/format'

/**
 * Карточка шаблона: свойства, к чему подходит и что подходит к нему,
 * аналоги в обе стороны. Слитый шаблон живёт под адресом победителя.
 */
const route = useRoute()
const { t, locale, localePath } = useI18n()
const api = useApi()
const id = String(route.params.template)

const { data: template } = await useAsyncData(`template:${locale.value}:${id}`, () => api<TemplateCard>(`/templates/${id}`))

if (!template.value) {
  throw createError({ statusCode: 404, statusMessage: 'Not Found', fatal: true })
}

// API переадресовал на победителя слияния — и страница переезжает.
if (template.value.template_id !== id) {
  await navigateTo(localePath(`/t/${template.value.template_id}`), { redirectCode: 301, replace: true })
}

const title = computed(() => (template.value ? templateTitle(template.value) : ''))
const sellQuery = computed(() => ({
  category: template.value?.category.name,
  brand: template.value?.brand?.name,
  model: template.value?.model?.name,
  part_number: template.value?.part_number ?? undefined,
}))

useSeoMeta({ title: () => title.value, ogTitle: () => title.value })
</script>

<template>
  <article v-if="template">
    <h1>{{ title }}</h1>
    <p v-if="template.status !== 'approved'" class="unverified">
      {{ t('catalog.templateUnverified') }}
    </p>
    <PropertyList :properties="template.properties" />
    <LinkedTemplates :title="t('ad.fits')" :templates="template.links.fits" linked />
    <LinkedTemplates :title="t('catalog.fittedBy')" :templates="template.links.fitted_by" linked />
    <LinkedTemplates :title="t('ad.replaces')" :templates="template.links.replaces" linked />
    <LinkedTemplates :title="t('ad.replacedBy')" :templates="template.links.replaced_by" linked />
    <p>
      <NuxtLink :to="{ path: localePath('/publish'), query: sellQuery }">
        {{ t('catalog.sellThis') }}
      </NuxtLink>
    </p>
  </article>
</template>

<style scoped>
.unverified {
  color: #8a5a00;
}
</style>
