<script setup lang="ts">
import { emptyIdentifier, type IdentifierDraft } from '~/utils/draft'

/** Номера экземпляра: VIN, серийный, номер двигателя — вид называет продавец. */
const rows = defineModel<IdentifierDraft[]>({ required: true })
const { t } = useI18n()
const suggest = useSuggest()
</script>

<template>
  <div class="rows">
    <div v-for="(row, index) in rows" :key="index" class="row">
      <SuggestInput v-model="row.kind" :suggest="suggest.kind('identifier_kind')" :placeholder="t('form.identifierKind')" />
      <input v-model="row.value" :placeholder="t('form.identifierValue')">
      <button type="button" class="remove" @click="rows.splice(index, 1)">
        ×
      </button>
    </div>
    <button type="button" class="add" @click="rows.push(emptyIdentifier())">
      {{ t('form.addIdentifier') }}
    </button>
  </div>
</template>
