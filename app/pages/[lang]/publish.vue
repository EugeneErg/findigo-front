<script setup lang="ts">
import type { AdCard, CategoryProperty, Location, PublishedAd } from '~/types/schema'
import { emptyAd, emptyProperty, toRequest, type AdDraft } from '~/utils/draft'
import { adPath } from '~/utils/format'

/**
 * Форма объявления: одна форма — каталог, вещь и объявление возникают
 * следствием. Всё вводится словами; незнакомое не ошибка — сервер
 * заведёт запись в карантин, и объявление опубликуется.
 */
const { t, locale, localePath } = useI18n()
const api = useApi()
const suggest = useSuggest()
const config = useRuntimeConfig()

useHead({ title: () => t('form.title') })

const draft = reactive<AdDraft>(emptyAd(''))
const route = useRoute()

// Пришли «продать такое же» с карточки шаблона или из группы витрины.
for (const [field, key] of [['category', 'category'], ['brand', 'brand'], ['model', 'model'], ['partNumber', 'part_number']] as const) {
  const value = route.query[key]

  if (typeof value === 'string') {
    draft[field] = value
  }
}
const questions = ref<CategoryProperty[]>([])
const brandEntry = ref<string | null>(null)
const currencies = ref<{ code: string, fraction_digits: number }[]>([])
const locations = ref<Location[]>([])
const sending = ref(false)
const errors = ref<string[]>([])
const published = ref<{ ad: AdCard, result: PublishedAd } | null>(null)
const canPublish = computed(() => config.public.devOrganizationId !== '')

onMounted(async () => {
  currencies.value = (await api<{ items: { code: string, fraction_digits: number }[] }>('/currencies')).items

  if (canPublish.value) {
    locations.value = (await api<{ items: Location[] }>('/locations')).items.filter(location => location.is_pickup_point)
  }
})

// Категория выбрана — какие вопросы ей задают и как.
let categoryTimer: ReturnType<typeof setTimeout> | undefined
watch(() => draft.category, (name) => {
  clearTimeout(categoryTimer)
  categoryTimer = setTimeout(async () => {
    const id = await suggest.categoryId(name)
    questions.value = id === null ? [] : await suggest.questions(id)

    for (const question of questions.value) {
      draft.answers[question.property_id] ??= {
        ...emptyProperty(question.name),
        kind: question.value_type === 'number' ? 'number' : 'designation',
      }
    }
  }, 300)
})

const models = (q: string) => (brandEntry.value ? suggest.modelsOf(brandEntry.value)(q) : suggest.kind('model')(q))

function messagesOf(body: unknown): string[] {
  if (typeof body !== 'object' || body === null) {
    return [t('error.generic')]
  }

  const data = body as { message?: string, errors?: Record<string, string[]> }

  if (data.errors) {
    return Object.entries(data.errors).flatMap(([field, list]) => list.map(message => `${field}: ${message}`))
  }

  return [data.message ?? t('error.generic')]
}

async function submit(): Promise<void> {
  errors.value = []
  sending.value = true

  try {
    const currency = currencies.value.find(item => item.code === draft.currency)
    const result = await api<PublishedAd>('/ads', {
      method: 'POST',
      body: toRequest(draft, currency?.fraction_digits ?? 2),
    })
    const ad = await api<AdCard>(`/ads/${result.ad_id}`)

    published.value = { ad, result }

    if (!result.needs_attention) {
      await navigateTo(adPath(locale.value, ad.slug, ad.number))
    }
  }
  catch (failure) {
    errors.value = messagesOf((failure as { data?: unknown }).data)
  }
  finally {
    sending.value = false
  }
}
</script>

<template>
  <section class="publish">
    <h1>{{ t('form.title') }}</h1>

    <p v-if="!canPublish" class="notice">
      {{ t('form.noOrganization') }}
    </p>

    <div v-if="published" class="done">
      <h2>{{ t('form.published') }}</h2>
      <template v-if="published.result.similar_template_ids.length > 0">
        <p>{{ t('form.similar', { count: published.result.similar_template_ids.length }) }}</p>
        <ul>
          <li v-for="similar in published.result.similar_template_ids" :key="similar">
            <NuxtLink :to="localePath(`/t/${similar}`)" target="_blank">
              {{ t('form.similarOpen') }}
            </NuxtLink>
          </li>
        </ul>
      </template>
      <p v-if="published.result.unreadable_properties.length > 0">
        {{ t('form.unreadable', { names: published.result.unreadable_properties.join(', ') }) }}
      </p>
      <NuxtLink :to="adPath(locale, published.ad.slug, published.ad.number)">
        {{ t('form.openAd') }}
      </NuxtLink>
    </div>

    <form v-else class="form" @submit.prevent="submit">
      <ul v-if="errors.length > 0" class="errors" role="alert">
        <li v-for="error in errors" :key="error">
          {{ error }}
        </li>
      </ul>

      <fieldset>
        <legend>{{ t('form.what') }}</legend>
        <SuggestInput v-model="draft.category" :suggest="suggest.kind('category')" :label="t('form.category')" required />
        <div class="row">
          <SuggestInput
            v-model="draft.brand"
            :suggest="suggest.kind('brand')"
            :label="t('form.brand')"
            @pick="brandEntry = $event?.entry_id ?? null"
          />
          <SuggestInput v-model="draft.model" :suggest="models" :eager="brandEntry !== null" :label="t('form.model')" />
        </div>
        <div class="row">
          <label class="field">
            <span class="label">{{ t('form.partNumber') }}</span>
            <input v-model="draft.partNumber">
          </label>
          <SuggestInput v-model="draft.manufacturer" :suggest="suggest.kind('manufacturer')" :label="t('form.manufacturer')" />
        </div>
      </fieldset>

      <fieldset>
        <legend>{{ t('form.specifications') }}</legend>
        <QuestionField
          v-for="question in questions"
          :key="question.property_id"
          v-model="draft.answers[question.property_id]!"
          :question="question"
        />
        <PropertyRows v-model="draft.properties" />
      </fieldset>

      <fieldset>
        <legend>{{ t('form.state') }}</legend>
        <SuggestInput v-model="draft.condition" :suggest="suggest.kind('condition')" :label="t('form.condition')" required />
        <DamageRows v-model="draft.damages" />
        <IdentifierRows v-model="draft.identifiers" />
      </fieldset>

      <fieldset>
        <legend>{{ t('form.configuration') }}</legend>
        <ComponentEditor v-model="draft.components" :parent-category="draft.category" />
      </fieldset>

      <fieldset>
        <legend>{{ t('form.fits') }}</legend>
        <TemplateDrafts v-model="draft.fits" />
      </fieldset>

      <fieldset>
        <legend>{{ t('form.replaces') }}</legend>
        <TemplateDrafts v-model="draft.analogs" mutual-choice />
      </fieldset>

      <fieldset>
        <legend>{{ t('form.deal') }}</legend>
        <div class="row">
          <label class="field">
            <span class="label">{{ t('form.price') }}</span>
            <input v-model="draft.price" inputmode="decimal" required>
          </label>
          <label class="field">
            <span class="label">{{ t('form.currency') }}</span>
            <select v-model="draft.currency" required>
              <option value="" disabled>—</option>
              <option v-for="currency in currencies" :key="currency.code" :value="currency.code">
                {{ currency.code }}
              </option>
            </select>
          </label>
          <label class="field">
            <span class="label">{{ t('form.quantity') }}</span>
            <input v-model.number="draft.quantity" type="number" min="1">
          </label>
        </div>
        <label v-if="locations.length > 0" class="field">
          <span class="label">{{ t('form.pickup') }}</span>
          <select v-model="draft.pickupLocationId">
            <option value="">—</option>
            <option v-for="location in locations" :key="location.location_id" :value="location.location_id">
              {{ [location.title, location.address].filter(Boolean).join(', ') }}
            </option>
          </select>
        </label>
        <label class="check">
          <input v-model="draft.onlineOnly" type="checkbox"> {{ t('form.onlineOnly') }}
        </label>
      </fieldset>

      <button type="submit" class="submit" :disabled="sending || !canPublish">
        {{ sending ? t('form.sending') : t('form.submit') }}
      </button>
    </form>
  </section>
</template>

<style>
.form {
  display: grid;
  gap: 16px;
  max-width: 820px;
}

.form fieldset {
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 12px 16px 16px;
  display: grid;
  gap: 10px;
}

.form legend {
  font-weight: 600;
  padding: 0 6px;
}

.field {
  display: grid;
  gap: 4px;
  flex: 1;
  min-width: 10rem;
}

.label {
  font-size: 0.875rem;
  color: var(--muted);
}

.row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: end;
}

.rows {
  display: grid;
  gap: 6px;
}

.form input,
.form select {
  font: inherit;
  padding: 6px 8px;
  border: 1px solid var(--line);
  border-radius: 6px;
  min-width: 0;
}

.check {
  display: flex;
  gap: 6px;
  align-items: center;
}

.add,
.remove {
  font: inherit;
  background: none;
  border: none;
  color: var(--accent);
  cursor: pointer;
  justify-self: start;
  padding: 2px 0;
}

.remove {
  color: var(--muted);
}

.submit {
  font: inherit;
  font-weight: 600;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  background: var(--accent);
  color: #fff;
  justify-self: start;
  cursor: pointer;
}

.submit:disabled {
  opacity: 0.5;
  cursor: default;
}

.errors {
  color: #b42318;
  background: #fef3f2;
  border-radius: 8px;
  padding: 12px 12px 12px 32px;
  margin: 0;
}

.notice {
  background: var(--soft);
  padding: 12px;
  border-radius: 8px;
}
</style>
