<script setup lang="ts">
import type { CategoryProperty } from '~/types/schema'
import type { PropertyDraft } from '~/utils/draft'

/**
 * Вопрос категории: как спрашивать — говорит описание свойства.
 * Число — числом с единицей (подсказки — единицы его величины,
 * по умолчанию — единица показа); список — значением с подсказками
 * значений этого свойства.
 */
const props = defineProps<{ question: CategoryProperty }>()
const answer = defineModel<PropertyDraft>({ required: true })
const { t } = useI18n()
const suggest = useSuggest()

if (answer.value.unit === '' && props.question.display_unit) {
  answer.value.unit = props.question.display_unit.name
}
</script>

<template>
  <div class="question">
    <span class="label">
      {{ question.name }}
      <span v-if="!question.is_approved" class="unverified">{{ t('common.unverified') }}</span>
    </span>
    <div v-if="question.value_type === 'number'" class="row">
      <input v-model="answer.number" inputmode="decimal" :placeholder="t('form.number')" :aria-label="question.name">
      <SuggestInput v-model="answer.unit" :suggest="suggest.forProperty(question.property_id)" eager :placeholder="t('form.unit')" />
    </div>
    <SuggestInput
      v-else
      v-model="answer.designation"
      :suggest="suggest.forProperty(question.property_id)"
      eager
      :placeholder="t('form.value')"
    />
  </div>
</template>

<style scoped>
.question {
  display: grid;
  gap: 4px;
}

.unverified {
  font-size: 0.8rem;
  color: #8a5a00;
  margin-left: 6px;
}
</style>
