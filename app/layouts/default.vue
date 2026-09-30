<script setup lang="ts">
import { REPO_LOCALES } from '~/utils/i18n'

interface Language {
  code: string
  name: string
}

const { locale, t, localePath } = useI18n()
const route = useRoute()
const config = useRuntimeConfig()

// Все языки — из бэка (ICU), с самоназванием. Бэк недоступен — хотя бы
// те, переводы которых лежат в репозитории, и текущий.
const { data: languages } = await useAsyncData('languages', async (): Promise<Language[]> => {
  try {
    const found = await $fetch<{ items: Language[] }>('/languages', {
      baseURL: import.meta.server ? config.apiBase : config.public.apiBase,
      timeout: 3000,
    })

    return found.items
  }
  catch {
    return [...new Set([...REPO_LOCALES, locale.value])].map(code => ({ code, name: languageName(code) }))
  }
})

useHead({ htmlAttrs: { lang: locale } })

/** Имя языка на нём самом — из ICU браузера и Node, а не из списка в коде. */
function languageName(code: string): string {
  const name = new Intl.DisplayNames([code], { type: 'language' }).of(code) ?? code

  return name.charAt(0).toLocaleUpperCase(code) + name.slice(1)
}

/** Та же страница на другом языке. */
function switchTo(code: string): string {
  return route.path.replace(/^\/[^/]+/, `/${code}`)
}

async function choose(event: Event): Promise<void> {
  const code = (event.target as HTMLSelectElement).value

  if (code !== locale.value) {
    await navigateTo(switchTo(code))
  }
}
</script>

<template>
  <div class="page">
    <header class="header">
      <NuxtLink :to="localePath('/')" class="logo">
        {{ t('site.name') }}
      </NuxtLink>
      <nav class="nav">
        <NuxtLink :to="localePath('/publish')">
          {{ t('nav.publish') }}
        </NuxtLink>
      </nav>
      <label class="languages">
        <span class="visually-hidden">{{ t('site.language') }}</span>
        <select :value="locale" @change="choose">
          <option v-for="language in languages ?? []" :key="language.code" :value="language.code" :lang="language.code">
            {{ language.name }}
          </option>
        </select>
      </label>
    </header>
    <main class="main">
      <slot />
    </main>
  </div>
</template>

<style>
:root {
  --ink: #1d1f23;
  --muted: #5c6370;
  --line: #e3e5e8;
  --accent: #0b6bcb;
  --paper: #ffffff;
  --soft: #f5f6f8;
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  color: var(--ink);
  background: var(--paper);
}

body {
  margin: 0;
}

a {
  color: var(--accent);
}

.page {
  max-width: 1080px;
  margin: 0 auto;
  padding: 0 16px 48px;
}

.header {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid var(--line);
}

.logo {
  font-weight: 700;
  font-size: 1.25rem;
  color: var(--ink);
  text-decoration: none;
}

.nav {
  flex: 1;
}

.languages select {
  font: inherit;
  font-size: 0.875rem;
  padding: 4px 8px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--paper);
  color: var(--ink);
  max-width: 12rem;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.main {
  padding-top: 24px;
}
</style>
