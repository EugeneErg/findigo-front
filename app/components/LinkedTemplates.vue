<script setup lang="ts">
import type { Schemas } from '~/types/schema'
import { propertyValue, templateTitle } from '~/utils/format'

/**
 * Связанные шаблоны: к чему подходит, что подходит, аналоги. Заявленное
 * продавцом видно сразу с пометкой «не проверено».
 */
withDefaults(defineProps<{ title: string, templates: Schemas['LinkedTemplate'][], linked?: boolean }>(), { linked: false })

const { t, locale, localePath } = useI18n()
const yesNo = (flag: boolean) => (flag ? t('common.yes') : t('common.no'))
</script>

<template>
  <section v-if="templates.length > 0" class="linked">
    <h3>{{ title }}</h3>
    <ul>
      <li v-for="template in templates" :key="template.template_id">
        <NuxtLink v-if="linked" :to="localePath(`/t/${template.template_id}`)">
          {{ templateTitle(template) }}
        </NuxtLink>
        <template v-else>
          {{ templateTitle(template) }}
        </template>
        <span v-for="property in template.properties" :key="property.property_id" class="property">
          {{ property.name }}: {{ propertyValue(property, locale, yesNo) }}
        </span>
        <span v-if="!template.is_approved" class="unverified">{{ t('common.unverified') }}</span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.linked ul {
  margin: 0;
  padding-left: 1.25rem;
}

.property {
  margin-left: 8px;
  color: var(--muted);
}

.unverified {
  margin-left: 8px;
  font-size: 0.8rem;
  color: #8a5a00;
}
</style>
