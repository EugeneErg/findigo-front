<script setup lang="ts">
import type { Suggestion } from '~/types/schema'

/**
 * Поле с подсказками. Ввод свободный: чего нет в подсказках, продавец
 * пишет сам — сервер заведёт запись в карантин (общий механизм).
 * Подсказки — родной datalist: работает везде, в том числе на телефоне.
 */
const props = withDefaults(defineProps<{
  modelValue: string
  suggest: (typed: string) => Promise<Suggestion[]>
  /** Подсказывать и на пустом вводе — весь список рамки. */
  eager?: boolean
  placeholder?: string
  required?: boolean
  label?: string
}>(), { eager: false, placeholder: '', required: false, label: '' })

const emit = defineEmits<{
  'update:modelValue': [value: string]
  /** Введённое совпало с подсказкой — её запись справочника. */
  'pick': [suggestion: Suggestion | null]
}>()

const id = useId()
const options = ref<Suggestion[]>([])
let timer: ReturnType<typeof setTimeout> | undefined
let request = 0

async function load(typed: string): Promise<void> {
  if (typed.trim() === '' && !props.eager) {
    options.value = []

    return
  }

  const mine = ++request

  try {
    const found = await props.suggest(typed)

    if (mine === request) {
      options.value = found
    }
  }
  catch {
    options.value = []
  }
}

function onInput(event: Event): void {
  const value = (event.target as HTMLInputElement).value
  emit('update:modelValue', value)
  emit('pick', options.value.find(option => option.value.toLocaleLowerCase() === value.trim().toLocaleLowerCase()) ?? null)
  clearTimeout(timer)
  timer = setTimeout(() => load(value), 200)
}

onMounted(() => {
  if (props.eager) {
    load(props.modelValue)
  }
})
</script>

<template>
  <label class="field">
    <span v-if="label" class="label">{{ label }}</span>
    <input
      :value="modelValue"
      :list="`${id}-list`"
      :placeholder="placeholder"
      :required="required"
      autocomplete="off"
      @input="onInput"
      @focus="load(modelValue)"
    >
    <datalist :id="`${id}-list`">
      <option v-for="option in options" :key="option.entry_id" :value="option.value" />
    </datalist>
  </label>
</template>
