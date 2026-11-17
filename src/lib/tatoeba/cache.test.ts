import 'fake-indexeddb/auto'
import { clear, set } from 'idb-keyval'
import { beforeEach, describe, expect, it } from 'vitest'
import type { Example } from '../data/types'
import {
  TATOEBA_CACHE_KEY,
  TATOEBA_CACHE_MAX_ENTRIES,
  TATOEBA_CACHE_TTL_MS,
  cacheKey,
  clearTatoebaCache,
  isCacheEntryFresh,
  pruneCache,
  readCachedExamples,
  readTatoebaCache,
  writeCachedExamples,
  type TatoebaCache,
} from './cache'

const examples: Example[] = [
  {
    jp: '共有したい？',
    en: 'Do you want to share it?',
    source: 'tatoeba',
    id: 1,
    url: 'https://tatoeba.org/en/sentences/show/1',
  },
]

beforeEach(async () => {
  await clear()
})

describe('cache keys and freshness', () => {
  it('normalizes the query and includes the limit and version', () => {
    expect(cacheKey(' 共有 ', 3)).toBe('v1:3:共有')
    expect(cacheKey('共有', 3)).toBe(cacheKey('　共有　', 3))
    expect(cacheKey('共有', 2)).not.toBe(cacheKey('共有', 3))
  })

  it('treats entries inside the TTL as fresh', () => {
    const now = 1_000_000

    expect(isCacheEntryFresh({ examples: [], fetchedAt: now }, now)).toBe(true)
    expect(isCacheEntryFresh({ examples: [], fetchedAt: now - TATOEBA_CACHE_TTL_MS }, now)).toBe(
      true,
    )
    expect(
      isCacheEntryFresh({ examples: [], fetchedAt: now - TATOEBA_CACHE_TTL_MS - 1 }, now),
    ).toBe(false)
  })

  it('rejects malformed entries', () => {
    expect(isCacheEntryFresh({ examples: 'nope' as unknown as Example[], fetchedAt: 1 }, 1)).toBe(
      false,
    )
  })
})

describe('cache pruning', () => {
  it('drops expired entries and keeps the newest', () => {
    const now = 10
    const cache: TatoebaCache = {
      old: { examples: [], fetchedAt: now - TATOEBA_CACHE_TTL_MS - 1 },
      fresh1: { examples: [], fetchedAt: now - 1 },
      fresh2: { examples: [], fetchedAt: now - 2 },
    }

    expect(Object.keys(pruneCache(cache, now))).toEqual(['fresh1', 'fresh2'])
  })

  it('caps the number of entries at 500', () => {
    const cache: TatoebaCache = Object.fromEntries(
      Array.from({ length: TATOEBA_CACHE_MAX_ENTRIES + 1 }, (_, index) => [
        `k${index}`,
        { examples: [], fetchedAt: index },
      ]),
    )

    expect(Object.keys(pruneCache(cache, TATOEBA_CACHE_MAX_ENTRIES + 1))).toHaveLength(
      TATOEBA_CACHE_MAX_ENTRIES,
    )
  })
})

describe('cache storage', () => {
  it('round-trips mapped examples through IndexedDB', async () => {
    const key = cacheKey('共有', 3)

    expect(await readCachedExamples(key, 100)).toBeNull()
    expect(await writeCachedExamples(key, examples, 100)).toBe(true)
    expect(await readCachedExamples(key, 101)).toEqual(examples)
    expect(await readCachedExamples(cacheKey('共有', 2), 101)).toBeNull()
  })

  it('caches empty result lists', async () => {
    const key = cacheKey('共有', 3)

    await writeCachedExamples(key, [], 100)
    expect(await readCachedExamples(key, 101)).toEqual([])
  })

  it('expires entries after the TTL', async () => {
    const key = cacheKey('共有', 3)

    await writeCachedExamples(key, examples, 0)
    expect(await readCachedExamples(key, TATOEBA_CACHE_TTL_MS + 1)).toBeNull()
  })

  it('ignores a malformed stored cache', async () => {
    const key = cacheKey('共有', 3)

    await set(TATOEBA_CACHE_KEY, { [key]: { examples: 'nope', fetchedAt: 1 } })
    expect(await readTatoebaCache()).toEqual({ [key]: { examples: 'nope', fetchedAt: 1 } })
    expect(await readCachedExamples(key, 2)).toBeNull()
  })

  it('clears the cache', async () => {
    const key = cacheKey('共有', 3)

    await writeCachedExamples(key, examples, 100)
    await clearTatoebaCache()
    expect(await readCachedExamples(key, 101)).toBeNull()
  })
})
