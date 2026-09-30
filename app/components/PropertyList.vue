<script setup lang="ts">
import type { TemplateView } from '~/types/schema'
import { propertyValue } from '~/utils/format'

defineProps<{ properties: TemplateView['properties'] }>()

const { t, locale } = useI18n()
const yesNo = (flag: boolean) => (flag ? t('common.yes') : t('common.no'))
</script>

<template>
  <dl v-if="properties.length > 0" class="properties">
    <template v-for="property in properties" :key="property.property_id">
      <dt>{{ property.name }}</dt>
      <dd>{{ propertyValue(property, locale, yesNo) }}</dd>
    </template>
  </dl>
</template>

<style scoped>
.properties {
  display: grid;
  grid-template-columns: minmax(8rem, max-content) 1fr;
  gap: 6px 24px;
  margin: 0;
}

dt {
  color: var(--muted);
}

dd {
  margin: 0;
}
</style>
