<script setup lang="ts">
import type { Schemas } from '~/types/schema'
import { formatNumber } from '~/utils/format'

defineProps<{ damages: Schemas['DamageView'][] }>()

const { locale } = useI18n()
</script>

<template>
  <ul v-if="damages.length > 0" class="damages">
    <li v-for="damage in damages" :key="damage.damage.id">
      {{ damage.damage.name }}<template v-if="damage.number !== null">
        — {{ formatNumber(damage.number, locale) }} {{ damage.unit?.name }}
      </template>
    </li>
  </ul>
</template>

<style scoped>
.damages {
  margin: 0;
  padding-left: 1.25rem;
}
</style>
