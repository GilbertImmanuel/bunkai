import type { Example } from '../data/types'
import { containsLookup, normalizeQuery } from './lookup'
import { TatoebaError } from './types'

export const TATOEBA_SEARCH_ENDPOINT = 'https://api.tatoeba.org/v1/sentences'
export const TATOEBA_AUDIO_ENDPOINT = 'https://api.tatoeba.org/v1/audios'
export const TATOEBA_WEB_BASE = 'https://tatoeba.org'
export const TATOEBA_LICENSE_URL = 'https://creativecommons.org/licenses/by/2.0/fr/'
export const TATOEBA_FETCH_LIMIT = 10
export const TATOEBA_PICK_LIMIT = 3
export const TATOEBA_TIMEOUT_MS = 12_000
export const TATOEBA_MIN_SENTENCE_LENGTH = 5
export const TATOEBA_MAX_SENTENCE_LENGTH = 40

export function buildTatoebaSearchUrl(query: string, limit = TATOEBA_FETCH_LIMIT): string {
  const params = new URLSearchParams()
  params.set('lang', 'jpn')
  params.set('q', normalizeQuery(query))
  params.set('sort', 'relevance')
  params.set('limit', String(limit))
  params.set('is_unapproved', 'no')
  params.set('trans:lang', 'eng')
  params.set('trans:is_unapproved', 'no')
  params.set('showtrans:lang', 'eng')
  params.set('showtrans:is_unapproved', 'no')
  params.set('include', 'audios')

  return `${TATOEBA_SEARCH_ENDPOINT}?${params.toString()}`
}

export function buildTatoebaSearchPageUrl(query: string): string {
  const params = new URLSearchParams()
  params.set('query', normalizeQuery(query))
  params.set('from', 'jpn')
  params.set('to', 'eng')

  return `${TATOEBA_WEB_BASE}/en/sentences/search?${params.toString()}`
}

export function buildTatoebaSentenceUrl(id: number): string {
  return `${TATOEBA_WEB_BASE}/en/sentences/show/${id}`
}

export function buildTatoebaAudioUrl(audioId: number): string {
  return `${TATOEBA_AUDIO_ENDPOINT}/${audioId}/file`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object'
}

interface ApprovedTranslation {
  text: string
  isDirect: boolean
}

function approvedEnglishTranslations(raw: Record<string, unknown>): ApprovedTranslation[] {
  if (!Array.isArray(raw.translations)) return []

  const translations: ApprovedTranslation[] = []

  for (const item of raw.translations) {
    if (!isRecord(item)) continue
    if (item.lang !== 'eng') continue
    if (item.is_unapproved === true) continue

    const text = typeof item.text === 'string' ? item.text.trim() : ''
    if (!text) continue

    translations.push({ text, isDirect: item.is_direct === true })
  }

  return translations
}

interface TatoebaAudioChoice {
  id: number
  author?: string
  license: string
}

function pickAudio(raw: Record<string, unknown>): TatoebaAudioChoice | undefined {
  if (!Array.isArray(raw.audios)) return undefined

  for (const item of raw.audios) {
    if (!isRecord(item)) continue

    const id = typeof item.id === 'number' ? item.id : Number(item.id)
    if (!Number.isInteger(id)) continue

    const license = typeof item.license === 'string' ? item.license.trim() : ''
    // Tatoeba's terms: an empty audio license may not be reused outside Tatoeba.
    if (!license) continue

    const author =
      typeof item.author === 'string' && item.author.trim() ? item.author.trim() : undefined

    return { id, author, license }
  }

  return undefined
}

function normalizedEnglish(value: string): string {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\s+/gu, ' ')
    .replace(/[.!?。！？]+$/u, '')
    .trim()
}

function characterCount(value: string): number {
  return Array.from(value).length
}

export interface MapTatoebaOptions {
  query: string
  exclude?: string
  pick?: number
}

/**
 * Maps a raw Tatoeba response to Bunkai examples. The response is untrusted:
 * malformed entries are skipped, not allowed to crash the sidebar.
 */
export function mapTatoebaResponse(payload: unknown, options: MapTatoebaOptions): Example[] {
  if (!isRecord(payload) || !Array.isArray(payload.data)) {
    throw new TatoebaError('format', 'Tatoeba returned an unreadable response.')
  }

  const query = normalizeQuery(options.query)
  const exclude = options.exclude ? normalizeQuery(options.exclude) : ''
  const pick = Math.max(1, options.pick ?? TATOEBA_PICK_LIMIT)
  const examples: Example[] = []
  const seenIds = new Set<number>()
  const seenEnglish = new Set<string>()

  for (const raw of payload.data) {
    if (!isRecord(raw)) continue
    if (raw.is_unapproved === true) continue
    if (raw.lang !== 'jpn') continue

    const id = typeof raw.id === 'number' ? raw.id : Number(raw.id)
    if (!Number.isInteger(id)) continue

    const text = typeof raw.text === 'string' ? raw.text.trim() : ''
    if (!text) continue
    if (query && !containsLookup(text, query)) continue

    const length = characterCount(text)
    if (length < TATOEBA_MIN_SENTENCE_LENGTH || length > TATOEBA_MAX_SENTENCE_LENGTH) {
      continue
    }

    if (exclude && normalizeQuery(text) === exclude) continue
    if (seenIds.has(id)) continue

    const translations = approvedEnglishTranslations(raw)
    const translation = translations.find((item) => item.isDirect) ?? translations[0]
    if (!translation) continue

    const englishKey = normalizedEnglish(translation.text)
    if (!englishKey || seenEnglish.has(englishKey)) continue

    const audio = pickAudio(raw)
    const license =
      typeof raw.license === 'string' && raw.license.trim() ? raw.license.trim() : undefined
    const author = typeof raw.owner === 'string' && raw.owner.trim() ? raw.owner.trim() : undefined

    examples.push({
      jp: text,
      en: translation.text,
      source: 'tatoeba',
      id,
      url: buildTatoebaSentenceUrl(id),
      ...(author ? { author } : {}),
      ...(license ? { license } : {}),
      ...(audio
        ? {
            audioUrl: buildTatoebaAudioUrl(audio.id),
            ...(audio.author ? { audioAuthor: audio.author } : {}),
            audioLicense: audio.license,
          }
        : {}),
    })

    seenIds.add(id)
    seenEnglish.add(englishKey)

    if (examples.length >= pick) break
  }

  return examples
}

export interface SearchTatoebaOptions {
  query: string
  /** Number of sentences requested from the API. */
  limit?: number
  /** Number of mapped examples to return to the UI. */
  pick?: number
  exclude?: string
  signal?: AbortSignal
  fetchImpl?: typeof fetch
  timeoutMs?: number
}

export async function searchTatoeba(options: SearchTatoebaOptions): Promise<Example[]> {
  const query = normalizeQuery(options.query)
  if (!query) return []
  if (options.signal?.aborted) {
    throw new TatoebaError('aborted', 'Tatoeba request was cancelled.')
  }

  const controller = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, options.timeoutMs ?? TATOEBA_TIMEOUT_MS)

  const onAbort = () => controller.abort()
  if (options.signal) {
    if (options.signal.aborted) controller.abort()
    else options.signal.addEventListener('abort', onAbort, { once: true })
  }

  try {
    const response = await (options.fetchImpl ?? fetch)(
      buildTatoebaSearchUrl(query, options.limit),
      {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      },
    )

    if (!response.ok) {
      throw new TatoebaError('http', 'Tatoeba is unavailable right now.', response.status)
    }

    let payload: unknown
    try {
      payload = await response.json()
    } catch {
      throw new TatoebaError('format', 'Tatoeba returned an unreadable response.')
    }

    return mapTatoebaResponse(payload, {
      query,
      exclude: options.exclude,
      pick: options.pick,
    })
  } catch (error) {
    if (error instanceof TatoebaError) throw error

    if (controller.signal.aborted) {
      if (timedOut) {
        throw new TatoebaError('timeout', 'Tatoeba took too long to respond.')
      }
      throw new TatoebaError('aborted', 'Tatoeba request was cancelled.')
    }

    throw new TatoebaError('network', 'Tatoeba could not be reached.')
  } finally {
    clearTimeout(timer)
    options.signal?.removeEventListener('abort', onAbort)
  }
}
