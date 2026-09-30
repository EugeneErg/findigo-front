<script setup lang="ts">
import { emptyComponent, type ComponentDraft } from '~/utils/draft'

/**
 * Комплектация деревом: слот из состава категории родителя (для
 * верхнего уровня — категории вещи), его повреждения — в том числе
 * «отсутствует», — по желанию конкретная деталь и своя комплектация.
 */
const props = defineProps<{ parentCategory: string }>()
const rows = defineModel<ComponentDraft[]>({ required: true })
const { t } = useI18n()
const suggest = useSuggest()
const parentId = ref<string | null>(null)

watch(() => props.parentCategory, async (name) => {
  parentId.value = await suggest.categoryId(name)
}, { immediate: true })

/** Слоты родителя из состава; состава ещё нет — любые категории. */
const slots = (q: string) => (parentId.value ? suggest.componentsOf(parentId.value)(q) : suggest.kind('category')(q))
</script>

<template>
  <div class="components">
    <div v-for="(row, index) in rows" :key="index" class="component">
      <div class="row">
        <SuggestInput v-model="row.category" :suggest="slots" eager :placeholder="t('form.slot')" />
        <input v-model.number="row.quantity" type="number" min="1" class="quantity" :aria-label="t('form.quantity')">
        <button type="button" class="remove" @click="rows.splice(index, 1)">
          ×
        </button>
      </div>
      <DamageRows v-model="row.damages" />
      <label class="check">
        <input v-model="row.withPart" type="checkbox"> {{ t('form.describePart') }}
      </label>
      <div v-if="row.withPart" class="part">
        <SuggestInput v-model="row.part.brand" :suggest="suggest.kind('brand')" :placeholder="t('form.brand')" />
        <input v-model="row.part.partNumber" :placeholder="t('form.partNumber')">
        <IdentifierRows v-model="row.part.identifiers" />
      </div>
      <ComponentEditor v-if="row.category.trim() !== ''" v-model="row.components" :parent-category="row.category" class="nested" />
    </div>
    <button type="button" class="add" @click="rows.push(emptyComponent())">
      {{ parentCategory ? t('form.addComponentTo', { parent: parentCategory }) : t('form.addComponent') }}
    </button>
  </div>
</template>

<style scoped>
.component {
  border-left: 2px solid var(--line);
  padding-left: 12px;
  margin-bottom: 12px;
  display: grid;
  gap: 6px;
}

.quantity {
  width: 5rem;
}

.nested {
  margin-left: 8px;
}
</style>
