import type { CategoryProperty, Suggestion } from '~/types/schema'

/** Источники подсказок формы — все через API, в рамках поля, где рамка есть. */
export function useSuggest() {
  const api = useApi()

  const kind = (name: string) => async (q: string): Promise<Suggestion[]> =>
    (await api<{ items: Suggestion[] }>('/suggestions', { query: { kind: name, q, limit: 10 } })).items

  const forProperty = (id: string) => async (q: string): Promise<Suggestion[]> =>
    (await api<{ items: Suggestion[] }>(`/properties/${id}/suggestions`, { query: { q, limit: 50 } })).items

  const modelsOf = (brandEntry: string) => async (q: string): Promise<Suggestion[]> =>
    (await api<{ items: Suggestion[] }>(`/brands/${brandEntry}/models`, { query: { q, limit: 50 } })).items

  const componentsOf = (categoryId: string) => async (q: string): Promise<Suggestion[]> => {
    const items = (await api<{ items: { category_id: string, name: string, is_approved: boolean }[] }>(
      `/categories/${categoryId}/components`,
    )).items
    const typed = q.trim().toLocaleLowerCase()

    return items
      .filter(item => item.name.toLocaleLowerCase().startsWith(typed))
      .map(item => ({ entry_id: item.category_id, value: item.name, is_approved: item.is_approved }))
  }

  /** id категории по имени — без заведения; null — такой ещё нет. */
  async function categoryId(name: string): Promise<string | null> {
    if (name.trim() === '') {
      return null
    }

    try {
      return (await api<{ category_id: string }>('/categories/lookup', { query: { name } })).category_id
    }
    catch {
      return null
    }
  }

  async function questions(categoryId: string): Promise<CategoryProperty[]> {
    return (await api<{ items: CategoryProperty[] }>(`/categories/${categoryId}/properties`)).items
  }

  return { kind, forProperty, modelsOf, componentsOf, categoryId, questions }
}
