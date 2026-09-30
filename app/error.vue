<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()
const { t, localePath } = useI18n()

const notFound = computed(() => props.error.statusCode === 404)

useHead({ title: () => (notFound.value ? t('error.notFound') : t('error.generic')) })
</script>

<template>
  <NuxtLayout>
    <section class="error">
      <h1>{{ notFound ? t('error.notFound') : t('error.generic') }}</h1>
      <p v-if="notFound">
        {{ t('error.notFoundHint') }}
      </p>
      <NuxtLink :to="localePath('/')" @click="clearError()">
        {{ t('error.toHome') }}
      </NuxtLink>
    </section>
  </NuxtLayout>
</template>
