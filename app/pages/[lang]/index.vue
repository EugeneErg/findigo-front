<script setup lang="ts">
import type { GroupMember } from '~/types/schema'

/** Главная: верхний уровень витрины. Группы заводит модерация. */
const { t, localePath } = useI18n()
const api = useApi()
const { locale } = useI18n()

const { data: groups } = await useAsyncData(`groups:${locale.value}`, async () =>
  (await api<{ items: GroupMember[] }>('/groups')).items)

useHead({ title: () => `${t('site.name')} — ${t('site.tagline')}` })
</script>

<template>
  <section class="home">
    <h1>{{ t('site.tagline') }}</h1>
    <ul v-if="groups && groups.length > 0" class="groups">
      <li v-for="group in groups" :key="group.id">
        <NuxtLink :to="localePath(`/g/${group.id}`)">
          {{ group.name }}
        </NuxtLink>
      </li>
    </ul>
    <p v-else class="empty">
      {{ t('catalog.emptyShowcase') }}
      <NuxtLink :to="localePath('/publish')">
        {{ t('nav.publish') }}
      </NuxtLink>
    </p>
  </section>
</template>

<style scoped>
.groups {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
  list-style: none;
  padding: 0;
}

.groups a {
  display: block;
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
}
</style>
