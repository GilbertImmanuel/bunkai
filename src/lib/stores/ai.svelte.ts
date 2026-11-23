import type { Session } from '../data/types'
import {
  AiRequestError,
  aiErrorMessage,
  normalizeProxyEndpoint,
  requestBreakdown,
  requestSessionEnrichment,
  testProviderConnection,
} from '../ai/breakdown'
import { getAiProvider, isAiProviderId, type AiProvider, type AiProviderId } from '../ai/providers'
import {
  activeModelFor,
  hasKeyFor,
  isActiveConfigured,
  isProviderConfigured,
  modelFor,
  proxyFor,
  readAiSettings,
  writeAiSettings,
  type AiSettings,
} from '../ai/settings'

export interface AiState {
  settings: AiSettings
  settingsOpen: boolean
}

export const aiState = $state<AiState>({
  settings: readAiSettings(),
  settingsOpen: false,
})

export function openAiSettings(): void {
  aiState.settingsOpen = true
}

export function closeAiSettings(): void {
  aiState.settingsOpen = false
}

export function toggleAiSettings(): void {
  aiState.settingsOpen = !aiState.settingsOpen
}

export function activeProvider(): AiProvider {
  return getAiProvider(aiState.settings.provider)
}

export function activeModel(): string {
  return activeModelFor(aiState.settings)
}

export function activeProxy(): string {
  return proxyFor(aiState.settings, aiState.settings.provider)
}

export function activeAiReady(): boolean {
  return isActiveConfigured(aiState.settings)
}

export function activeAiMissingProxy(): boolean {
  const provider = activeProvider()
  return provider.requiresProxy && hasKeyFor(aiState.settings, provider.id) && !activeProxy()
}

export function hasStoredKey(providerId: AiProviderId): boolean {
  return hasKeyFor(aiState.settings, providerId)
}

export function storedModel(providerId: AiProviderId): string {
  return modelFor(aiState.settings, providerId)
}

export function storedProxy(providerId: AiProviderId): string {
  return proxyFor(aiState.settings, providerId)
}

export function providerReady(providerId: AiProviderId): boolean {
  return isProviderConfigured(aiState.settings, providerId)
}

export interface SettingsWriteResult {
  persisted: boolean
  error: string | null
}

function persist(): boolean {
  return writeAiSettings($state.snapshot(aiState.settings) as AiSettings)
}

export interface SaveAiPreferencesInput {
  provider: AiProviderId
  model: string
  key: string
  proxy: string
}

export function saveAiPreferences(input: SaveAiPreferencesInput): SettingsWriteResult {
  if (!isAiProviderId(input.provider)) {
    return { persisted: false, error: 'Choose a supported AI provider.' }
  }

  const provider = getAiProvider(input.provider)
  const key = input.key.trim()

  let proxy = input.proxy.trim()
  if (provider.requiresProxy && proxy) {
    try {
      proxy = normalizeProxyEndpoint(proxy)
    } catch (error) {
      return { persisted: false, error: aiErrorMessage(error) }
    }
  }

  aiState.settings.provider = provider.id
  aiState.settings.models[provider.id] = input.model.trim() || provider.defaultModel

  if (key) aiState.settings.keys[provider.id] = key

  if (provider.requiresProxy) {
    if (proxy) {
      aiState.settings.proxies[provider.id] = proxy
    } else {
      delete aiState.settings.proxies[provider.id]
    }
  }

  if (!persist()) {
    return {
      persisted: false,
      error: 'Settings could not be saved in this browser. Check site storage permissions.',
    }
  }

  const stored = readAiSettings()
  if (key && !hasKeyFor(stored, provider.id)) {
    return {
      persisted: false,
      error: 'The API key could not be saved in this browser. Check site storage permissions.',
    }
  }
  if (provider.requiresProxy && proxy && proxyFor(stored, provider.id) !== proxy) {
    return {
      persisted: false,
      error: 'The proxy endpoint could not be saved in this browser.',
    }
  }

  return { persisted: true, error: null }
}

export function removeStoredKey(providerId: AiProviderId): SettingsWriteResult {
  delete aiState.settings.keys[providerId]

  if (!persist()) {
    return {
      persisted: false,
      error: 'The key could not be removed from this browser. Check site storage permissions.',
    }
  }

  if (hasKeyFor(readAiSettings(), providerId)) {
    return {
      persisted: false,
      error: 'The key is still stored in this browser. Check site storage permissions.',
    }
  }

  return { persisted: true, error: null }
}

export async function generateWithAi(sentence: string): Promise<Session> {
  const provider = activeProvider()
  const key = aiState.settings.keys[provider.id]?.trim()
  if (!key) {
    throw new AiRequestError(
      'missing-key',
      'Add an API key in AI settings, or continue in sample mode.',
    )
  }

  const proxyUrl = activeProxy()
  if (provider.requiresProxy && !proxyUrl) {
    throw new AiRequestError('missing-proxy', 'OpenCode needs a proxy endpoint in AI settings.')
  }

  return requestBreakdown({
    providerId: provider.id,
    model: activeModel(),
    key,
    proxyUrl,
    sentence,
  })
}

export async function enrichSession(session: Session): Promise<Session> {
  const provider = activeProvider()
  const key = aiState.settings.keys[provider.id]?.trim()
  if (!key) {
    throw new AiRequestError(
      'missing-key',
      'Add an API key in AI settings to add colors and furigana.',
    )
  }

  const proxyUrl = activeProxy()
  if (provider.requiresProxy && !proxyUrl) {
    throw new AiRequestError('missing-proxy', 'OpenCode needs a proxy endpoint in AI settings.')
  }

  const enrichment = await requestSessionEnrichment({
    providerId: provider.id,
    model: activeModel(),
    key,
    proxyUrl,
    sentence: session.sentence,
    natural: session.natural,
    chunks: session.chunks,
  })

  return {
    ...session,
    ...(enrichment.naturalParts.length ? { naturalParts: enrichment.naturalParts } : {}),
    chunks: session.chunks.map((chunk) => {
      const furigana = enrichment.furigana.find((entry) => entry.n === chunk.n)?.furigana
      return furigana?.length ? { ...chunk, furigana } : chunk
    }),
  }
}

export interface TestAiConnectionInput {
  provider: AiProviderId
  model: string
  key: string
  proxy: string
}

export async function testAiConnection(input: TestAiConnectionInput): Promise<void> {
  const provider = getAiProvider(input.provider)
  const key = input.key.trim() || aiState.settings.keys[provider.id]?.trim() || ''
  if (!key) {
    throw new AiRequestError(
      'missing-key',
      'Add an API key in AI settings before testing the connection.',
    )
  }

  const proxyUrl = input.proxy.trim() || aiState.settings.proxies[provider.id]?.trim() || ''
  if (provider.requiresProxy && !proxyUrl) {
    throw new AiRequestError(
      'missing-proxy',
      'Add an OpenCode proxy endpoint before testing the connection.',
    )
  }

  await testProviderConnection({
    providerId: provider.id,
    model: input.model.trim() || provider.defaultModel,
    key,
    proxyUrl,
  })
}
