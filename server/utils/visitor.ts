import type { H3Event } from 'h3'
import type { CountryResponse, Reader } from 'maxmind'

/**
 * Страна посетителя по IP. Сначала — заголовок CDN (Cloudflare сам
 * кладёт CF-IPCountry; имя заголовка — настройка), иначе — база GeoIP
 * (MaxMind GeoLite2 Country), если путь к ней задан. IP дальше этого
 * места не уходит: бэк получает только код страны.
 */
let reader: Promise<Reader<CountryResponse> | null> | undefined

function geoip(path: string): Promise<Reader<CountryResponse> | null> {
  reader ??= import('maxmind')
    .then(maxmind => maxmind.open<CountryResponse>(path))
    .catch((error: unknown) => {
      console.warn(`GeoIP: не открылась база ${path}`, error)

      return null
    })

  return reader
}

function countryCode(value: unknown): string | null {
  const code = typeof value === 'string' ? value.trim().toUpperCase() : ''

  // XX — неизвестна, T1 — Tor: это не страны.
  return /^[A-Z]{2}$/.test(code) && code !== 'XX' && code !== 'T1' ? code : null
}

export async function visitorCountry(event: H3Event): Promise<string | null> {
  const config = useRuntimeConfig(event)
  const header = config.countryHeader ? countryCode(getRequestHeader(event, config.countryHeader)) : null

  if (header !== null || !config.geoipDatabase) {
    return header
  }

  const ip = getRequestIP(event, { xForwardedFor: config.trustForwardedFor })
  const database = ip ? await geoip(config.geoipDatabase) : null

  return ip && database ? countryCode(database.get(ip)?.country?.iso_code) : null
}
