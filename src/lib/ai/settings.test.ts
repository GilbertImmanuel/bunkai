import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  AI_SETTINGS_KEY,
  defaultAiSettings,
  isProviderConfigured,
  readAiSettings,
  writeAiSettings,
} from './settings'

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

beforeEach(() => {
  vi.stubGlobal('localStorage', new MemoryStorage())
})

describe('AI settings', () => {
  it('defaults to OpenRouter with no keys', () => {
    expect(readAiSettings()).toEqual(defaultAiSettings())
  })

  it('round-trips provider, models, proxies, and per-provider keys', () => {
    const settings = {
      ...defaultAiSettings(),
      provider: 'opencode' as const,
      keys: { openrouter: 'sk-or-test', opencode: 'opencode-test' },
      models: { opencode: 'deepseek-v4.1-flash' },
      proxies: { opencode: 'http://127.0.0.1:8787/v1/chat/completions' },
    }

    writeAiSettings(settings)
    expect(readAiSettings()).toEqual(settings)
  })

  it('reports a failed storage write', () => {
    const storage = new MemoryStorage()
    storage.setItem = () => {
      throw new Error('quota exceeded')
    }
    vi.stubGlobal('localStorage', storage)

    expect(writeAiSettings(defaultAiSettings())).toBe(false)
  })

  it('validates settings and requires a proxy for OpenCode', () => {
    localStorage.setItem(
      AI_SETTINGS_KEY,
      JSON.stringify({
        provider: 'not-a-provider',
        keys: { opencode: 'opencode-test', unknown: 'ignored' },
        models: { opencode: 'custom-model' },
        proxies: {},
      }),
    )

    const settings = readAiSettings()
    expect(settings.provider).toBe('openrouter')
    expect(settings.keys).toEqual({ opencode: 'opencode-test' })
    expect(settings.models).toEqual({ opencode: 'custom-model' })
    expect(isProviderConfigured(settings, 'opencode')).toBe(false)

    settings.proxies.opencode = 'http://127.0.0.1:8787/v1/chat/completions'
    expect(isProviderConfigured(settings, 'opencode')).toBe(true)
  })
})
