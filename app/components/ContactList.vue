<script setup lang="ts">
import type { Schemas } from '~/types/schema'

defineProps<{ contacts: Schemas['Contact'][] }>()
</script>

<template>
  <ul v-if="contacts.length > 0" class="contacts">
    <li v-for="contact in contacts" :key="`${contact.kind.id}-${contact.value}`">
      <span class="kind">{{ contact.kind.name }}:</span>
      <a v-if="contact.link" :href="contact.link" rel="nofollow noopener">{{ contact.value }}</a>
      <span v-else>{{ contact.value }}</span>
    </li>
  </ul>
</template>

<style scoped>
.contacts {
  list-style: none;
  margin: 0;
  padding: 0;
}

.kind {
  margin-right: 6px;
  color: var(--muted);
}
</style>
