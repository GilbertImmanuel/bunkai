import type {
  Chunk,
  ChunkColor,
  ConstructionStep,
  Example,
  FuriganaSegment,
  Session,
  TranslationPart,
} from '../data/types'
import { getAiProvider, type AiProvider, type AiProviderId } from './providers'

export type AiErrorKind =
  | 'missing-key'
  | 'missing-proxy'
  | 'invalid-key'
  | 'rate-limit'
  | 'model'
  | 'network'
  | 'provider'
  | 'format'
  | 'timeout'
  | 'unknown'

export class AiRequestError extends Error {
  constructor(
    public readonly kind: AiErrorKind,
    message: string,
  ) {
    super(message)
    this.name = 'AiRequestError'
  }
}

export function aiErrorMessage(error: unknown): string {
  if (error instanceof AiRequestError) return error.message
  return 'The breakdown request failed. Try again or use the sample.'
}

const SYSTEM_PROMPT = `You are Bunkai, a Japanese reading assistant. Analyze one Japanese sentence and return ONLY a JSON object. Do not use markdown fences, comments, or prose outside the JSON.

The JSON must have this exact shape:
{
  "reading": "whole-sentence kana, with ・ between chunks",
  "natural": "a natural adapted English translation",
  "naturalParts": [
    { "text": "I just ", "chunk": 0 },
    { "text": "felt like sharing ", "chunk": 5 },
    { "text": "it ", "chunk": 3 }
  ],
  "raw": "literal chunk-order gloss, with | between pieces",
  "chunks": [
    {
      "jp": "Japanese chunk",
      "kana": "kana for this chunk",
      "gloss": "literal English gloss",
      "role": "lowercase role label",
      "color": 1,
      "lookup": "心",
      "note": "concise chunk-specific grammar note",
      "construction": [{ "jp": "form", "en": "explanation" }],
      "examples": [{ "jp": "verified Japanese example", "en": "English meaning" }],
      "furigana": [
        { "text": "心", "reading": "こころ", "kind": "word" },
        { "text": "が" },
        { "text": "動", "reading": "うご", "kind": "word" },
        { "text": "いた" }
      ]
    }
  ],
  "sentenceNote": ["2–3 short paragraphs explaining topic, core, modifiers, and nuance"]
}

Rules:
- Use 2–6 chunks. Preserve the original sentence when the chunks are joined.
- Use distinct color numbers from 1 to 6.
- Use roles such as adverb, time clause, object, accompaniment, main verb, predicate, subject, particle, topic, location, and degree. Include a main verb/predicate when present.
- Construction steps should be short JP/EN pairs. Examples should be 1–2 correct, simple Japanese sentences.
- lookup is a short Japanese search term (1–6 characters) that appears verbatim in the chunk. Prefer the distinctive content word (a noun, verb, or adjective). Use an unambiguous grammar pattern only when it appears verbatim and is not a substring of a common different pattern. Never return a bare particle or auxiliary (は, が, を, に, の, と, も, で, へ, から, まで, だけ, した, ている, そう).
- furigana text values must concatenate exactly to the chunk's jp text, in order, including every kana and punctuation mark. Omit reading and kind on kana-only parts.
- Furigana readings are hiragana for the kanji portion only; keep okurigana outside the ruby, e.g. 動いた → 動 (うご) + いた.
- Use kind "name" for proper names (people, places, organizations) and "word" for ordinary kanji vocabulary. If a reading is uncertain, omit it rather than guess.
- The raw gloss is literal and unpolished; the natural translation is adapted English.
- naturalParts must concatenate exactly to natural, including spaces and punctuation. Put each space inside the part where it belongs.
- Each naturalParts text maps to the chunk that supplies its meaning. Use chunk 0 only when no chunk matches. Use the chunk number even when the English phrase appears in a different order from the Japanese; a chunk number may appear more than once. The chunk number is the 1-based position in the chunks array, not the color value.
- Do not include HTML. The sentenceNote is plain text.
- Return valid JSON only.`

const SESSION_ENRICHMENT_PROMPT = `You enrich a saved Japanese breakdown by aligning its English translation and adding furigana. Return ONLY a JSON object. Do not use markdown fences, comments, or prose.

The JSON must have this exact shape:
{
  "naturalParts": [
    { "text": "English text including its spaces", "chunk": 1 },
    { "text": "more text.", "chunk": 0 }
  ],
  "chunks": [
    {
      "n": 1,
      "furigana": [
        { "text": "田中", "reading": "たなか", "kind": "name" },
        { "text": "さんは" }
      ]
    }
  ]
}

Rules:
- Concatenate all naturalParts text values in order. The result must equal natural exactly, including spaces and punctuation.
- Each naturalParts part maps to the chunk that supplies its meaning. Use chunk 0 only when no chunk matches. The English word order may differ from the Japanese; a chunk number may appear more than once. Use the 1-based position in the chunks array, not the color value.
- For each input chunk that contains kanji, return one chunks entry with that chunk's n and a furigana array. Furigana text values must concatenate exactly to that chunk's jp text, in order.
- Furigana readings are hiragana for the kanji portion only; keep okurigana outside the ruby, e.g. 動いた → 動 (うご) + いた.
- Use kind "name" for proper names (people, places, organizations) and "word" for ordinary kanji vocabulary. Omit reading and kind on kana-only parts. If a reading is uncertain, omit it rather than guess.
- Omit chunks that contain no kanji. If neither a usable natural mapping nor any furigana can be produced, return an empty object.
- Return valid JSON only.`

export interface AiRequestOptions {
  providerId: AiProviderId
  model: string
  key: string
  proxyUrl?: string
  sentence: string
  fetchImpl?: typeof fetch
  now?: Date
}

interface RequestParts {
  endpoint: string
  headers: Record<string, string>
  body: Record<string, unknown>
}

function normalizeProxyEndpoint(proxy: string): string {
  const trimmed = proxy.trim()
  if (!trimmed) {
    throw new AiRequestError('missing-proxy', 'OpenCode needs a proxy endpoint in AI settings.')
  }

  if (
    !trimmed.startsWith('http://') &&
    !trimmed.startsWith('https://') &&
    !trimmed.startsWith('/')
  ) {
    throw new AiRequestError('missing-proxy', 'The OpenCode proxy endpoint is not a valid URL.')
  }

  const clean = trimmed.replace(/\/+$/, '')
  if (clean.endsWith('/chat/completions')) return clean
  if (clean.endsWith('/v1')) return `${clean}/chat/completions`
  if (/^https?:\/\/[^/]+$/.test(clean) || clean === '' || clean === '/') {
    return `${clean}/v1/chat/completions`
  }

  return `${clean}/chat/completions`
}

function resolveEndpoint(provider: AiProvider, proxyUrl = ''): string {
  if (!provider.requiresProxy) return provider.endpoint

  return normalizeProxyEndpoint(proxyUrl)
}

function requestHeaders(provider: AiProvider, key: string): Record<string, string> {
  if (provider.apiStyle === 'anthropic') {
    return {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${key}`,
  }

  if (provider.id === 'openrouter') {
    headers['X-OpenRouter-Title'] = 'Bunkai'
    if (typeof window !== 'undefined' && window.location?.origin) {
      headers['HTTP-Referer'] = window.location.origin
    }
  }

  return headers
}

function requestParts(
  provider: AiProvider,
  model: string,
  key: string,
  message: string,
  proxyUrl: string,
  systemPrompt = SYSTEM_PROMPT,
  maxTokens = 4000,
): RequestParts {
  const headers = requestHeaders(provider, key)

  if (provider.apiStyle === 'anthropic') {
    return {
      endpoint: resolveEndpoint(provider, proxyUrl),
      headers,
      body: {
        model,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: message }],
      },
    }
  }

  return {
    endpoint: resolveEndpoint(provider, proxyUrl),
    headers,
    body: {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
    },
  }
}

function mapStatus(provider: AiProvider, status: number): AiRequestError {
  if (status === 401 || status === 403) {
    return new AiRequestError(
      'invalid-key',
      'The API key was rejected. Check it in AI settings, or continue with the sample.',
    )
  }

  if (status === 429) {
    return new AiRequestError(
      'rate-limit',
      'The provider is rate-limiting requests. Wait a moment and try again.',
    )
  }

  if (status === 404) {
    return new AiRequestError(
      'model',
      'The model was not found. Check the model name in AI settings.',
    )
  }

  if (status === 400) {
    return new AiRequestError(
      'model',
      'The provider rejected the request. Check the model name in AI settings and try again.',
    )
  }

  if (status >= 500) {
    return new AiRequestError(
      'provider',
      `${provider.label} is unavailable right now. Try again later.`,
    )
  }

  return new AiRequestError(
    'provider',
    'The provider could not complete the breakdown. Try again or use the sample.',
  )
}

async function sendRequest(
  parts: RequestParts,
  provider: AiProvider,
  fetchImpl: typeof fetch,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetchImpl(parts.endpoint, {
      method: 'POST',
      headers: parts.headers,
      body: JSON.stringify(parts.body),
      signal: controller.signal,
    })

    if (!response.ok) throw mapStatus(provider, response.status)
    return response
  } catch (error) {
    if (error instanceof AiRequestError) throw error

    const name = (error as { name?: string } | null)?.name
    if (name === 'AbortError') {
      throw new AiRequestError('timeout', 'The request timed out. Try again.')
    }

    throw new AiRequestError(
      'network',
      provider.requiresProxy
        ? 'Could not reach the OpenCode proxy. Check that it is running and returns Access-Control-Allow-Origin on POST responses.'
        : `Could not reach ${provider.label} from this browser. It may block direct browser requests.`,
    )
  } finally {
    clearTimeout(timer)
  }
}

function contentString(content: unknown): string {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''

  return content
    .map((part) => {
      if (typeof part === 'string') return part
      if (part && typeof part === 'object' && 'text' in part) {
        const text = (part as { text?: unknown }).text
        return typeof text === 'string' ? text : ''
      }
      return ''
    })
    .filter(Boolean)
    .join('\n')
}

async function readResponseText(response: Response, provider: AiProvider): Promise<string> {
  let data: unknown
  try {
    data = await response.json()
  } catch {
    throw new AiRequestError(
      'format',
      'The provider returned an unreadable response. Try again or use the sample.',
    )
  }

  if (!data || typeof data !== 'object') {
    throw new AiRequestError(
      'format',
      'The provider returned an empty response. Try again or use the sample.',
    )
  }

  if (provider.apiStyle === 'anthropic') {
    const blocks = (data as { content?: unknown }).content
    const text = contentString(blocks)
    if (!text) {
      throw new AiRequestError(
        'format',
        'The provider returned an empty breakdown. Try again or use the sample.',
      )
    }
    return text
  }

  const choices = (data as { choices?: unknown }).choices
  const choice = Array.isArray(choices)
    ? (choices[0] as Record<string, unknown> | undefined)
    : undefined
  const errorMessage = choice?.error
  if (errorMessage && typeof errorMessage === 'object' && 'message' in errorMessage) {
    throw new AiRequestError(
      'provider',
      'The provider could not complete the breakdown. Try again or use the sample.',
    )
  }

  const message = choice?.message as { content?: unknown } | undefined
  const text = contentString(message?.content)
  if (!text) {
    throw new AiRequestError(
      'format',
      'The provider returned an empty breakdown. Try again or use the sample.',
    )
  }
  return text
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function stringArray(value: unknown): string[] {
  if (typeof value === 'string') return value.trim() ? [value.trim()] : []
  if (!Array.isArray(value)) return []
  return value.map(stringValue).filter(Boolean)
}

function constructionSteps(value: unknown): ConstructionStep[] {
  if (!Array.isArray(value)) return []

  return value
    .map((step) => {
      if (!step || typeof step !== 'object') return null
      const raw = step as Record<string, unknown>
      const jp = stringValue(raw.jp)
      const en = stringValue(raw.en)
      return jp && en ? { jp, en } : null
    })
    .filter((step): step is ConstructionStep => Boolean(step))
}

function examples(value: unknown): Example[] {
  if (!Array.isArray(value)) return []

  return value
    .map((example) => {
      if (!example || typeof example !== 'object') return null
      const raw = example as Record<string, unknown>
      const jp = stringValue(raw.jp)
      const en = stringValue(raw.en)
      return jp && en ? { jp, en } : null
    })
    .filter((example): example is Example => Boolean(example))
}

function colorValue(value: unknown, index: number): ChunkColor {
  const numeric = typeof value === 'number' ? value : Number(value)
  if (Number.isInteger(numeric) && numeric >= 1 && numeric <= 6) {
    return numeric as ChunkColor
  }
  return ((index % 6) + 1) as ChunkColor
}

function joinNaturalText(previous: string, next: string): string {
  if (!previous) return next
  if (/\s$/.test(previous) && /^\s/.test(next)) return next.replace(/^\s+/, '')
  if (/\s$/.test(previous) || /^\s/.test(next)) return next
  if (/^[.,!?;:’'”…—–-]/.test(next)) return next
  if (/[(‘“]$/.test(previous)) return next
  return ` ${next}`
}

function furiganaSegments(value: unknown, jp: string): FuriganaSegment[] | undefined {
  if (!Array.isArray(value)) return undefined

  const segments: FuriganaSegment[] = []
  let hasReading = false

  for (const item of value) {
    if (!item || typeof item !== 'object') continue
    const raw = item as Record<string, unknown>
    const text = typeof raw.text === 'string' ? raw.text : ''
    if (!text) continue

    const reading = typeof raw.reading === 'string' ? raw.reading.trim() : ''
    const kind = raw.kind === 'name' || raw.kind === 'word' ? raw.kind : undefined

    if (reading) {
      segments.push({ text, reading, kind: kind ?? 'word' })
      hasReading = true
    } else {
      segments.push({ text })
    }
  }

  if (!hasReading) return undefined
  const joined = segments.map((segment) => segment.text).join('')
  if (joined === jp) return segments

  if (jp.startsWith(joined)) {
    const remainder = jp.slice(joined.length)
    if (/^[。．.!！?？、,，」』）)】]+$/.test(remainder)) {
      const last = segments[segments.length - 1]
      if (last?.reading) return [...segments, { text: remainder }]
      if (last) {
        return [...segments.slice(0, -1), { ...last, text: last.text + remainder }]
      }
    }
  }

  return undefined
}

function naturalParts(
  value: unknown,
  natural: string,
  chunks: Array<{ n: number }>,
): TranslationPart[] | undefined {
  if (!natural || !Array.isArray(value)) return undefined

  const parts: TranslationPart[] = []
  let joined = ''

  for (const item of value) {
    if (!item || typeof item !== 'object') continue
    const raw = item as Record<string, unknown>
    const rawText = typeof raw.text === 'string' ? raw.text : ''
    if (!rawText) continue

    const text = joinNaturalText(joined, rawText)
    if (!text) continue

    const chunkNumber = typeof raw.chunk === 'number' ? raw.chunk : Number(raw.chunk)
    const chunk = Number.isInteger(chunkNumber)
      ? chunks.find((entry) => entry.n === chunkNumber)
      : undefined

    joined += text
    parts.push(chunk ? { text, chunk: chunk.n } : { text })
  }

  if (parts.length === 0) return undefined
  return joined === natural ? parts : undefined
}

export function parseBreakdownResponse(
  text: string,
  sentence: string,
  now: Date = new Date(),
): Session {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start < 0 || end <= start) {
    throw new AiRequestError(
      'format',
      'The model returned a breakdown in an unexpected format. Try again or use the sample.',
    )
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(text.slice(start, end + 1))
  } catch {
    throw new AiRequestError(
      'format',
      'The model returned a breakdown in an unexpected format. Try again or use the sample.',
    )
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new AiRequestError(
      'format',
      'The model returned a breakdown in an unexpected format. Try again or use the sample.',
    )
  }

  const raw = parsed as Record<string, unknown>
  const rawChunks = Array.isArray(raw.chunks) ? raw.chunks : []
  const chunks: Chunk[] = []

  for (const [index, value] of rawChunks.entries()) {
    if (!value || typeof value !== 'object') continue
    const chunk = value as Record<string, unknown>
    const jp = stringValue(chunk.jp)
    if (!jp) continue
    const furigana = furiganaSegments(chunk.furigana, jp)
    const lookup = stringValue(chunk.lookup)

    chunks.push({
      n: chunks.length + 1,
      jp,
      kana: stringValue(chunk.kana),
      gloss: stringValue(chunk.gloss),
      role: stringValue(chunk.role) || 'chunk',
      color: colorValue(chunk.color, index),
      note: stringValue(chunk.note),
      construction: constructionSteps(chunk.construction),
      examples: examples(chunk.examples),
      ...(furigana ? { furigana } : {}),
      ...(lookup ? { lookup } : {}),
    })

    if (chunks.length >= 8) break
  }

  if (chunks.length === 0) {
    throw new AiRequestError(
      'format',
      'The model returned no usable chunks. Try again or use the sample.',
    )
  }

  const input = sentence.trim()
  const joined = chunks.map((chunk) => chunk.jp).join('')
  if (joined !== input && input.startsWith(joined)) {
    const remainder = input.slice(joined.length)
    if (/^[。．.!！?？、,，」』）)】]+$/.test(remainder)) {
      const last = chunks[chunks.length - 1]
      const furigana = last.furigana
      const tail = furigana?.[furigana.length - 1]
      const nextFurigana =
        furigana && tail
          ? tail.reading
            ? [...furigana, { text: remainder }]
            : [...furigana.slice(0, -1), { ...tail, text: tail.text + remainder }]
          : furigana

      chunks[chunks.length - 1] = {
        ...last,
        jp: last.jp + remainder,
        ...(nextFurigana ? { furigana: nextFurigana } : {}),
      }
    }
  }

  const note = stringArray(raw.sentenceNote)
  const natural = stringValue(raw.natural)
  const parts = naturalParts(raw.naturalParts, natural, chunks)
  const rawGloss =
    stringValue(raw.raw) ||
    chunks
      .map((chunk) => chunk.gloss)
      .filter(Boolean)
      .join(' | ')

  return {
    id: `ai-${now.getTime()}`,
    sentence: input,
    reading: stringValue(raw.reading),
    natural,
    ...(parts ? { naturalParts: parts } : {}),
    raw: rawGloss,
    chunks,
    sentenceNote: note,
    createdAt: now.toISOString(),
    source: 'ai',
  }
}

export interface SessionEnrichment {
  naturalParts: TranslationPart[]
  furigana: Array<{ n: number; furigana: FuriganaSegment[] }>
}

function parseSessionEnrichmentResponse(
  text: string,
  natural: string,
  chunks: Chunk[],
): SessionEnrichment {
  const error = new AiRequestError(
    'format',
    'The model could not enrich this session. Try again or regenerate the breakdown.',
  )

  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start < 0 || end <= start) throw error

  let parsed: unknown
  try {
    parsed = JSON.parse(text.slice(start, end + 1))
  } catch {
    throw error
  }

  if (!parsed || typeof parsed !== 'object') throw error

  const raw = parsed as Record<string, unknown>
  const parts = naturalParts(raw.naturalParts, natural, chunks) ?? []
  const furigana: Array<{ n: number; furigana: FuriganaSegment[] }> = []

  if (Array.isArray(raw.chunks)) {
    for (const item of raw.chunks) {
      if (!item || typeof item !== 'object') continue
      const entry = item as Record<string, unknown>
      const n = typeof entry.n === 'number' ? entry.n : Number(entry.n)
      const chunk = Number.isInteger(n) ? chunks.find((value) => value.n === n) : undefined
      if (!chunk) continue

      const segments = furiganaSegments(entry.furigana, chunk.jp)
      if (segments) furigana.push({ n: chunk.n, furigana: segments })
    }
  }

  if (parts.length === 0 && furigana.length === 0) throw error

  return { naturalParts: parts, furigana }
}

export async function requestBreakdown(options: AiRequestOptions): Promise<Session> {
  const provider = getAiProvider(options.providerId)
  const key = options.key.trim()
  if (!key) {
    throw new AiRequestError(
      'missing-key',
      'Add an API key in AI settings, or continue in sample mode.',
    )
  }

  const parts = requestParts(
    provider,
    options.model.trim() || provider.defaultModel,
    key,
    `Sentence to analyze:\n${options.sentence}`,
    options.proxyUrl ?? '',
  )
  const response = await sendRequest(parts, provider, options.fetchImpl ?? fetch, 60_000)
  const text = await readResponseText(response, provider)
  return parseBreakdownResponse(text, options.sentence, options.now ?? new Date())
}

export interface SessionEnrichmentOptions {
  providerId: AiProviderId
  model: string
  key: string
  proxyUrl?: string
  sentence: string
  natural: string
  chunks: Chunk[]
  fetchImpl?: typeof fetch
}

export async function requestSessionEnrichment(
  options: SessionEnrichmentOptions,
): Promise<SessionEnrichment> {
  const provider = getAiProvider(options.providerId)
  const key = options.key.trim()
  if (!key) {
    throw new AiRequestError(
      'missing-key',
      'Add an API key in AI settings to add colors and furigana.',
    )
  }

  if (!options.natural.trim()) {
    throw new AiRequestError('format', 'This session has no natural translation to color.')
  }

  const payload = {
    sentence: options.sentence,
    natural: options.natural,
    chunks: options.chunks.map((chunk) => ({
      n: chunk.n,
      jp: chunk.jp,
      kana: chunk.kana,
      gloss: chunk.gloss,
      role: chunk.role,
    })),
  }

  const parts = requestParts(
    provider,
    options.model.trim() || provider.defaultModel,
    key,
    JSON.stringify(payload),
    options.proxyUrl ?? '',
    SESSION_ENRICHMENT_PROMPT,
    2_400,
  )
  const response = await sendRequest(parts, provider, options.fetchImpl ?? fetch, 60_000)
  const text = await readResponseText(response, provider)
  return parseSessionEnrichmentResponse(text, options.natural, options.chunks)
}

export async function testProviderConnection(
  options: Omit<AiRequestOptions, 'sentence' | 'now'>,
): Promise<void> {
  const provider = getAiProvider(options.providerId)
  const key = options.key.trim()
  if (!key) {
    throw new AiRequestError(
      'missing-key',
      'Add an API key in AI settings before testing the connection.',
    )
  }

  const parts = requestParts(
    provider,
    options.model.trim() || provider.defaultModel,
    key,
    'Reply with exactly: OK',
    options.proxyUrl ?? '',
  )

  if (provider.apiStyle === 'anthropic') {
    parts.body.max_tokens = 8
  }

  await sendRequest(parts, provider, options.fetchImpl ?? fetch, 20_000)
}
