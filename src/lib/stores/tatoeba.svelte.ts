import { SvelteMap } from 'svelte/reactivity'
import type { Example } from '../data/types'
import { TATOEBA_FETCH_LIMIT, TATOEBA_PICK_LIMIT, searchTatoeba } from '../tatoeba/client'
import { cacheKey, readCachedExamples, writeCachedExamples } from '../tatoeba/cache'
import { normalizeQuery } from '../tatoeba/lookup'
import { TatoebaError } from '../tatoeba/types'

export type TatoebaStatus = 'idle' | 'loading' | 'ready' | 'empty' | 'error'

export interface TatoebaState {
  status: TatoebaStatus
  query: string
  examples: Example[]
  fromCache: boolean
  error: string
}

export const tatoebaState = $state<TatoebaState>({
  status: 'idle',
  query: '',
  examples: [],
  fromCache: false,
  error: '',
})

const memoryCache = new SvelteMap<string, Example[]>()

let currentController: AbortController | null = null
let currentToken = 0
let currentKey: string | null = null

function isSameSentence(a: string, b: string): boolean {
  return normalizeQuery(a) === normalizeQuery(b)
}

function filterExcluded(examples: Example[], exclude?: string): Example[] {
  if (!exclude) return examples
  return examples.filter((example) => !isSameSentence(example.jp, exclude))
}

function setExamples(query: string, examples: Example[], fromCache: boolean): void {
  tatoebaState.query = query
  tatoebaState.examples = examples
  tatoebaState.fromCache = fromCache
  tatoebaState.error = ''
  tatoebaState.status = examples.length > 0 ? 'ready' : 'empty'
}

export interface LoadTatoebaOptions {
  query: string
  exclude?: string
  /** Number of examples to display and cache. The API request size is fixed at 10. */
  limit?: number
  force?: boolean
}

export async function loadTatoebaExamples(options: LoadTatoebaOptions): Promise<void> {
  const query = normalizeQuery(options.query)
  if (!query) {
    resetTatoeba()
    return
  }

  const pick = options.limit ?? TATOEBA_PICK_LIMIT
  const key = cacheKey(query, pick)

  if (!options.force && currentKey === key && tatoebaState.status === 'loading') return

  currentController?.abort()
  const controller = new AbortController()
  currentController = controller
  currentKey = key
  const token = ++currentToken

  const memory = memoryCache.get(key)
  if (memory && !options.force) {
    setExamples(query, filterExcluded(memory, options.exclude), true)
    return
  }

  const cached = await readCachedExamples(key)
  if (token !== currentToken) return

  if (cached && !options.force) {
    memoryCache.set(key, cached)
    setExamples(query, filterExcluded(cached, options.exclude), true)
    return
  }

  tatoebaState.status = 'loading'
  tatoebaState.query = query
  tatoebaState.examples = []
  tatoebaState.fromCache = false
  tatoebaState.error = ''

  try {
    const examples = await searchTatoeba({
      query,
      limit: TATOEBA_FETCH_LIMIT,
      pick,
      exclude: options.exclude,
      signal: controller.signal,
    })

    if (token !== currentToken) return

    const plain = $state.snapshot(examples) as Example[]
    memoryCache.set(key, plain)
    await writeCachedExamples(key, plain)

    if (token !== currentToken) return
    setExamples(query, plain, false)
  } catch (error) {
    if (token !== currentToken) return
    if (error instanceof TatoebaError && error.kind === 'aborted') return

    tatoebaState.status = 'error'
    tatoebaState.query = query
    tatoebaState.examples = []
    tatoebaState.fromCache = false
    tatoebaState.error =
      error instanceof TatoebaError && error.kind === 'timeout'
        ? 'Tatoeba took too long to respond.'
        : 'Tatoeba is unavailable right now.'
  }
}

export function cancelTatoebaLoad(): void {
  currentController?.abort()
  currentController = null
  currentToken++
  currentKey = null

  if (tatoebaState.status === 'loading') {
    tatoebaState.status = 'idle'
    tatoebaState.examples = []
    tatoebaState.fromCache = false
    tatoebaState.error = ''
  }
}

export function resetTatoeba(): void {
  currentController?.abort()
  currentController = null
  currentToken++
  currentKey = null

  tatoebaState.status = 'idle'
  tatoebaState.query = ''
  tatoebaState.examples = []
  tatoebaState.fromCache = false
  tatoebaState.error = ''
}
