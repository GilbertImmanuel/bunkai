import { AI_PROVIDERS, getAiProvider, isAiProviderId, type AiProviderId } from './providers'

export const AI_SETTINGS_KEY = 'bunkai.ai'

export interface AiSettings {
  provider: AiProviderId
  keys: Partial<Record<AiProviderId, string>>
  models: Partial<Record<AiProviderId, string>>
  proxies: Partial<Record<AiProviderId, string>>
}

export function defaultAiSettings(): AiSettings {
  return {
    provider: 'openrouter',
    keys: {},
    models: {},
    proxies: {},
  }
}

function stringMap(value: unknown): Partial<Record<AiProviderId, string>> {
  if (!value || typeof value !== 'object') return {}

  const result: Partial<Record<AiProviderId, string>> = {}
  for (const provider of AI_PROVIDERS) {
    const entry = (value as Record<string, unknown>)[provider.id]
    if (typeof entry === 'string' && entry.trim()) result[provider.id] = entry.trim()
  }
  return result
}

function normalizeSettings(value: unknown): AiSettings {
  if (!value || typeof value !== 'object') return defaultAiSettings()

  const raw = value as Partial<AiSettings>
  return {
    provider: isAiProviderId(raw.provider) ? raw.provider : 'openrouter',
    keys: stringMap(raw.keys),
    models: stringMap(raw.models),
    proxies: stringMap(raw.proxies),
  }
}

export function readAiSettings(): AiSettings {
  if (typeof localStorage === 'undefined') return defaultAiSettings()

  try {
    const raw = localStorage.getItem(AI_SETTINGS_KEY)
    if (!raw) return defaultAiSettings()
    return normalizeSettings(JSON.parse(raw))
  } catch {
    return defaultAiSettings()
  }
}

export function writeAiSettings(settings: AiSettings): boolean {
  if (typeof localStorage === 'undefined') return false

  try {
    localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(settings))
    return true
  } catch {
    // AI settings are best-effort. The app still works in sample mode.
    return false
  }
}

export function modelFor(settings: AiSettings, providerId: AiProviderId): string {
  return settings.models[providerId]?.trim() || getAiProvider(providerId).defaultModel
}

export function proxyFor(settings: AiSettings, providerId: AiProviderId): string {
  return settings.proxies[providerId]?.trim() || ''
}

export function hasKeyFor(settings: AiSettings, providerId: AiProviderId): boolean {
  return Boolean(settings.keys[providerId]?.trim())
}

export function isProviderConfigured(settings: AiSettings, providerId: AiProviderId): boolean {
  const provider = getAiProvider(providerId)
  return (
    hasKeyFor(settings, providerId) &&
    (!provider.requiresProxy || Boolean(proxyFor(settings, providerId)))
  )
}

export function isActiveConfigured(settings: AiSettings): boolean {
  return isProviderConfigured(settings, settings.provider)
}

export function activeModelFor(settings: AiSettings): string {
  return modelFor(settings, settings.provider)
}

export function activeProxyFor(settings: AiSettings): string {
  return proxyFor(settings, settings.provider)
}
