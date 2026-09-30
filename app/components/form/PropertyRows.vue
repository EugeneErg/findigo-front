<script setup lang="ts">
import { emptyProperty, type PropertyDraft } from '~/utils/draft'

/** Свойства, которых нет среди вопросов: имя и число с единицей или значение. */
const rows = defineModel<PropertyDraft[]>({ required: true })
const { t } = useI18n()
const suggest = useSuggest()
</script>

<template>
  <div class="rows">
    <div v-for="(row, index) in rows" :key="index" class="row">
      <SuggestInput v-model="row.name" :suggest="suggest.kind('property')" :placeholder="t('form.propertyName')" />
      <select v-model="row.kind" :aria-label="t('form.propertyKind')">
        <option value="number">
          {{ t('form.kindNumber') }}
        </option>
        <option value="designation">
          {{ t('form.kindDesignation') }}
        </option>
      </select>
      <template v-if="row.kind === 'number'">
        <input v-model="row.number" inputmode="decimal" :placeholder="t('form.number')">
        <SuggestInput v-model="row.unit" :suggest="suggest.kind('unit')" :placeholder="t('form.unit')" />
      </template>
      <SuggestInput v-else v-model="row.designation" :suggest="suggest.kind('property_value')" :placeholder="t('form.value')" />
      <button type="button" class="remove" @click="rows.splice(index, 1)">
        ×
      </button>
    </div>
    <button type="button" class="add" @click="rows.push(emptyProperty())">
      {{ t('form.addProperty') }}
    </button>
  </div>
</template>
