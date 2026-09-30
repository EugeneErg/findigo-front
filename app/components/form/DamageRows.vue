<script setup lang="ts">
import { emptyDamage, type DamageDraft } from '~/utils/draft'

/** Повреждения и износ — одно: скол, пробег, наработка; число — с единицей. */
const rows = defineModel<DamageDraft[]>({ required: true })
const { t } = useI18n()
const suggest = useSuggest()
</script>

<template>
  <div class="rows">
    <div v-for="(row, index) in rows" :key="index" class="row">
      <SuggestInput v-model="row.name" :suggest="suggest.kind('damage')" :placeholder="t('form.damage')" />
      <input v-model="row.number" inputmode="decimal" :placeholder="t('form.numberOptional')">
      <SuggestInput v-model="row.unit" :suggest="suggest.kind('unit')" :placeholder="t('form.unit')" />
      <button type="button" class="remove" @click="rows.splice(index, 1)">
        ×
      </button>
    </div>
    <button type="button" class="add" @click="rows.push(emptyDamage())">
      {{ t('form.addDamage') }}
    </button>
  </div>
</template>
