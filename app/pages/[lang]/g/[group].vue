<script setup lang="ts">
import type { GroupMember } from '~/types/schema'

/**
 * Группа витрины: вложенные группы и категории. Страница категории
 * с объявлениями и фильтрами — этап 6 (поиск); пока категория ведёт
 * к продаже в ней.
 */
const route = useRoute()
const { t, locale, localePath } = useI18n()
const api = useApi()
const id = String(route.params.group)

const { data: group } = await useAsyncData(`group:${locale.value}:${id}`, () =>
  api<{ group_id: string, name: string, items: GroupMember[] }>(`/groups/${id}`))

if (!group.value) {
  throw createError({ statusCode: 404, statusMessage: 'Not Found', fatal: true })
}

useHead({ title: () => group.value?.name ?? '' })
</script>

<template>
  <section v-if="group">
    <h1>{{ group.name }}</h1>
    <ul class="members">
      <li v-for="member in group.items" :key="member.id">
        <NuxtLink v-if="member.type === 'group'" :to="localePath(`/g/${member.id}`)" class="group">
          {{ member.name }}
        </NuxtLink>
        <template v-else>
          {{ member.name }}
          <NuxtLink :to="{ path: localePath('/publish'), query: { category: member.name } }" class="sell">
            {{ t('catalog.sellHere') }}
          </NuxtLink>
        </template>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.members {
  padding-left: 1.25rem;
}

.group {
  font-weight: 600;
}

.sell {
  margin-left: 8px;
  font-size: 0.875rem;
}
</style>
