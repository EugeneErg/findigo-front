<script setup lang="ts">
import { emptyTemplate, type TemplateDraft } from '~/utils/draft'

/**
 * Другая сторона связи — к чему подходит или вместо чего ставится —
 * описывается так же, как своя вещь; каждый вариант отдельно: «Camry
 * 2012–2016» — пять строк с годом выпуска.
 */
withDefaults(defineProps<{ mutualChoice?: boolean }>(), { mutualChoice: false })
const rows = defineModel<TemplateDraft[]>({ required: true })
const { t } = useI18n()
const suggest = useSuggest()

</script>

<template>
  <div class="drafts">
    <div v-for="(row, index) in rows" :key="index" class="draft">
      <div class="row">
        <SuggestInput v-model="row.category" :suggest="suggest.kind('category')" :placeholder="t('form.category')" />
        <SuggestInput v-model="row.brand" :suggest="suggest.kind('brand')" :placeholder="t('form.brand')" />
        <SuggestInput v-model="row.model" :suggest="suggest.kind('model')" :placeholder="t('form.model')" />
        <input v-model="row.partNumber" :placeholder="t('form.partNumber')">
        <button type="button" class="remove" @click="rows.splice(index, 1)">
          ×
        </button>
      </div>
      <PropertyRows v-model="row.properties" />
      <label v-if="mutualChoice" class="check">
        <input v-model="row.mutual" type="checkbox"> {{ t('form.mutual') }}
      </label>
    </div>
    <button type="button" class="add" @click="rows.push(emptyTemplate())">
      {{ t('form.addVariant') }}
    </button>
  </div>
</template>

<style scoped>
.draft {
  border-left: 2px solid var(--line);
  padding-left: 12px;
  margin-bottom: 12px;
  display: grid;
  gap: 6px;
}
</style>
