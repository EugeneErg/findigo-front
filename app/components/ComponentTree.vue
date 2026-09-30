<script setup lang="ts">
import type { ComponentView } from '~/types/schema'

/**
 * Комплектация деревом, как её описал продавец: в автомобиле двигатель,
 * в двигателе свечи. Количество вложенной строки — на единицу родителя.
 */
defineProps<{ components: ComponentView[] }>()

const { t } = useI18n()
</script>

<template>
  <ul class="tree">
    <li v-for="(component, index) in components" :key="`${component.category.id}-${index}`">
      <span class="slot">{{ component.category.name }}</span>
      <span v-if="component.quantity > 1" class="quantity">× {{ component.quantity }}</span>
      <span v-for="identifier in component.part?.identifiers ?? []" :key="identifier.kind.id" class="identifier">
        {{ identifier.kind.name }}: {{ identifier.value ?? t('ad.identifierHidden') }}
      </span>
      <DamageList :damages="component.damages" />
      <ComponentTree v-if="component.components.length > 0" :components="component.components" />
    </li>
  </ul>
</template>

<style scoped>
.tree {
  margin: 0;
  padding-left: 1.25rem;
}

.quantity,
.identifier {
  margin-left: 8px;
  color: var(--muted);
}
</style>
