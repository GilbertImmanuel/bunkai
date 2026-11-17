import { get, set } from 'idb-keyval'
import type { Example } from '../data/types'
import { normalizeQuery } from './lookup'

export const TATOEBA_CACHE_KEY = 'bunkai.tatoeba.cache'
export const TATOEBA_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000
export const TATOEBA_CACHE_MAX_ENTRIES = 500
// Bump when the fetch limit, mapping, or filters change so old cached examples are ignored.
const CACHE_VERSION = 'v1'

export interface TatoebaCacheEntry {
  examples: Example[]
  fetchedAt: number
}

export type TatoebaCache = Record<string, TatoebaCacheEntry>

export function cacheKey(query: string, limit: number): string {
  return `${CACHE_VERSION}:${limit}:${normalizeQuery(query)}`
}

export function isCacheEntryFresh(entry: TatoebaCacheEntry, now = Date.now()): boolean {
  if (!entry || !Array.isArray(entry.examples) || typeof entry.fetchedAt !== 'number') {
    return false
  }

  return Math.abs(now - entry.fetchedAt) <= TATOEBA_CACHE_TTL_MS
}

export function pruneCache(
  cache: TatoebaCache,
  now = Date.now(),
  max = TATOEBA_CACHE_MAX_ENTRIES,
): TatoebaCache {
  const entries = Object.entries(cache)
    .filter(([, entry]) => isCacheEntryFresh(entry, now))
    .sort(([, a], [, b]) => b.fetchedAt - a.fetchedAt)
    .slice(0, max)

  return Object.fromEntries(entries)
}

export async function readTatoebaCache(): Promise<TatoebaCache> {
  try {
    const stored = await get<TatoebaCache>(TATOEBA_CACHE_KEY)
    if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return {}
    return stored
  } catch {
    return {}
  }
}

export async function readCachedExamples(key: string, now = Date.now()): Promise<Example[] | null> {
  const cache = await readTatoebaCache()
  const entry = cache[key]

  if (!entry || !isCacheEntryFresh(entry, now)) return null
  return entry.examples
}

let writeQueue: Promise<void> = Promise.resolve()

export async function writeCachedExamples(
  key: string,
  examples: Example[],
  now = Date.now(),
): Promise<boolean> {
  let saved = false

  writeQueue = writeQueue.then(async () => {
    try {
      const cache = await readTatoebaCache()
      cache[key] = { examples, fetchedAt: now }
      await set(TATOEBA_CACHE_KEY, pruneCache(cache, now))
      saved = true
    } catch {
      saved = false
    }
  })

  await writeQueue
  return saved
}

export async function clearTatoebaCache(): Promise<void> {
  try {
    await set(TATOEBA_CACHE_KEY, {})
  } catch {
    // The cache is best-effort; the app still works without it.
  }
}
