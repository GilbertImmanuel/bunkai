import 'fake-indexeddb/auto'
import { clear } from 'idb-keyval'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { sampleSession } from '../data/sample'
import {
  STORAGE_KEYS,
  readFurigana,
  readLastSessionId,
  readLayout,
  readSessions,
  readTheme,
  readTranslationMode,
  writeFurigana,
  writeLastSessionId,
  writeLayout,
  writeSessions,
  writeTheme,
  writeTranslationMode,
} from './persistence'

class MemoryStorage {
  private values = new Map<string, string>()

  get length(): number {
    return this.values.size
  }

  clear(): void {
    this.values.clear()
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null
  }

  removeItem(key: string): void {
    this.values.delete(key)
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }
}

beforeEach(async () => {
  vi.stubGlobal('localStorage', new MemoryStorage())
  await clear()
})

describe('preference persistence', () => {
  it('round-trips theme, translation, furigana, layout, and last session', () => {
    expect(readTheme()).toBeNull()
    writeTheme('dark')
    expect(readTheme()).toBe('dark')

    expect(readTranslationMode()).toBeNull()
    writeTranslationMode('raw')
    expect(readTranslationMode()).toBe('raw')

    expect(readFurigana()).toBeNull()
    writeFurigana({ name: true, word: false })
    expect(readFurigana()).toEqual({ name: true, word: false })

    expect(readLayout()).toBeNull()
    writeLayout({ history: 'collapsed', note: 'open' })
    expect(readLayout()).toEqual({ history: 'collapsed', note: 'open' })

    expect(readLastSessionId()).toBeNull()
    writeLastSessionId('sample')
    expect(readLastSessionId()).toBe('sample')
  })

  it('ignores malformed layout preferences', () => {
    localStorage.setItem(STORAGE_KEYS.layout, '{not-json')
    expect(readLayout()).toBeNull()

    localStorage.setItem(STORAGE_KEYS.layout, JSON.stringify({ history: 'nope', note: 'open' }))
    expect(readLayout()).toBeNull()
  })

  it('ignores an unknown furigana mode', () => {
    localStorage.setItem(STORAGE_KEYS.furigana, 'sometimes')
    expect(readFurigana()).toBeNull()
  })

  it('migrates the old four-mode furigana setting', () => {
    localStorage.setItem(STORAGE_KEYS.furigana, 'none')
    expect(readFurigana()).toEqual({ name: false, word: false })

    localStorage.setItem(STORAGE_KEYS.furigana, 'name')
    expect(readFurigana()).toEqual({ name: true, word: false })

    localStorage.setItem(STORAGE_KEYS.furigana, 'word')
    expect(readFurigana()).toEqual({ name: false, word: true })

    localStorage.setItem(STORAGE_KEYS.furigana, 'all')
    expect(readFurigana()).toEqual({ name: true, word: true })
  })
})

describe('session persistence', () => {
  it('round-trips sessions through IndexedDB', async () => {
    expect(await readSessions()).toBeUndefined()

    await writeSessions([sampleSession])
    const stored = await readSessions()

    expect(stored).toHaveLength(1)
    expect(stored?.[0].id).toBe('sample')
    expect(stored?.[0].chunks).toHaveLength(6)
  })
})
