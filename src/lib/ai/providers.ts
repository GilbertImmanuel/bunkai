export type AiProviderId = 'openrouter' | 'opencode' | 'openai' | 'claude'

export type AiApiStyle = 'openai' | 'anthropic'

export interface AiProvider {
  id: AiProviderId
  label: string
  defaultModel: string
  apiStyle: AiApiStyle
  endpoint: string
  requiresProxy: boolean
  proxyPlaceholder?: string
  keyPlaceholder: string
  keyUrl: string
  note?: string
}

export const AI_PROVIDERS: AiProvider[] = [
  {
    id: 'openrouter',
    label: 'OpenRouter',
    defaultModel: 'openrouter/auto',
    apiStyle: 'openai',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    requiresProxy: false,
    keyPlaceholder: 'sk-or-v1-…',
    keyUrl: 'https://openrouter.ai/keys',
  },
  {
    id: 'opencode',
    label: 'OpenCode',
    defaultModel: 'deepseek-v4.1-flash',
    apiStyle: 'openai',
    endpoint: '',
    requiresProxy: true,
    proxyPlaceholder: 'http://127.0.0.1:8787/v1/',
    keyPlaceholder: 'OpenCode Console API key',
    keyUrl: 'https://opencode.ai/console',
    note: 'OpenCode blocks direct browser calls. Use your own OpenAI-compatible proxy endpoint.',
  },
  {
    id: 'openai',
    label: 'OpenAI',
    defaultModel: 'gpt-5.2',
    apiStyle: 'openai',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    requiresProxy: false,
    keyPlaceholder: 'sk-…',
    keyUrl: 'https://platform.openai.com/api-keys',
  },
  {
    id: 'claude',
    label: 'Claude',
    defaultModel: 'claude-sonnet-4-6',
    apiStyle: 'anthropic',
    endpoint: 'https://api.anthropic.com/v1/messages',
    requiresProxy: false,
    keyPlaceholder: 'sk-ant-…',
    keyUrl: 'https://console.anthropic.com/settings/keys',
  },
]

export function getAiProvider(id: AiProviderId): AiProvider {
  return AI_PROVIDERS.find((provider) => provider.id === id) ?? AI_PROVIDERS[0]
}

export function isAiProviderId(value: unknown): value is AiProviderId {
  return AI_PROVIDERS.some((provider) => provider.id === value)
}
