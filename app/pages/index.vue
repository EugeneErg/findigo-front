<script setup lang="ts">
import { DEFAULT_LOCALE, acceptedLanguages, visitorOf } from '#shared/utils/languages'

/**
 * Корень сайта ведёт на язык посетителя — даже если интерфейса на нём
 * ещё нет: страница будет по-английски, а перевод бэк уже заказал.
 * Язык определил сервер фронта (браузер, иначе страна по IP).
 */
const visitor = import.meta.server ? visitorOf(useRequestEvent()?.context) : undefined
const lang = visitor?.lang ?? acceptedLanguages(import.meta.client ? navigator.languages.join(',') : '')[0] ?? DEFAULT_LOCALE

await navigateTo(`/${lang}`, { redirectCode: 302, replace: true })
</script>

<template>
  <div />
</template>
