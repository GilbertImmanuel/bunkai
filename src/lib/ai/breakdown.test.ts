import { describe, expect, it, vi } from 'vitest'
import type { Chunk } from '../data/types'
import {
  AiRequestError,
  normalizeProxyEndpoint,
  parseBreakdownResponse,
  requestBreakdown,
  requestSessionEnrichment,
  testProviderConnection,
} from './breakdown'

const breakdown = {
  reading: 'ねこが・すきです',
  natural: 'I like cats.',
  naturalParts: [
    { text: 'I ', chunk: 0 },
    { text: 'like ', chunk: 2 },
    { text: 'cats.', chunk: 1 },
  ],
  raw: 'cats | like',
  chunks: [
    {
      jp: '猫が',
      kana: 'ねこが',
      gloss: 'cats',
      role: 'subject',
      color: 1,
      lookup: '猫',
      note: '猫 is the subject.',
      construction: [{ jp: '猫 + が', en: 'cat (subject)' }],
      examples: [{ jp: '猫が好きです。', en: 'I like cats.' }],
      furigana: [{ text: '猫', reading: 'ねこ', kind: 'word' }, { text: 'が' }],
    },
    {
      jp: '好きです',
      kana: 'すきです',
      gloss: 'like',
      role: 'predicate',
      color: 2,
      lookup: '好き',
      note: '好きです is the predicate.',
      construction: [{ jp: '好き + です', en: 'like (polite)' }],
      examples: [{ jp: '音楽が好きです。', en: 'I like music.' }],
      furigana: [{ text: '好', reading: 'す', kind: 'word' }, { text: 'きです' }],
    },
  ],
  sentenceNote: ['The subject is 猫が.', '好きです is the predicate.'],
}

function openAiResponse(content: string): Response {
  return new Response(
    JSON.stringify({
      choices: [{ message: { role: 'assistant', content } }],
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )
}

function anthropicResponse(content: string): Response {
  return new Response(
    JSON.stringify({
      content: [{ type: 'text', text: content }],
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )
}

const now = new Date('2026-11-03T12:00:00.000Z')

describe('AI breakdown parsing', () => {
  it('parses fenced JSON and builds a typed session', () => {
    const session = parseBreakdownResponse(
      `\`\`\`json\n${JSON.stringify(breakdown)}\n\`\`\``,
      '猫が好きです。',
      now,
    )

    expect(session.sentence).toBe('猫が好きです。')
    expect(session.source).toBe('ai')
    expect(session.chunks).toHaveLength(2)
    expect(session.chunks.map((chunk) => chunk.n)).toEqual([1, 2])
    expect(session.chunks.map((chunk) => chunk.color)).toEqual([1, 2])
    expect(session.natural).toBe('I like cats.')
    expect(session.naturalParts).toEqual([
      { text: 'I ' },
      { text: 'like ', chunk: 2 },
      { text: 'cats.', chunk: 1 },
    ])
    expect(session.chunks[0].furigana).toEqual([
      { text: '猫', reading: 'ねこ', kind: 'word' },
      { text: 'が' },
    ])
    expect(session.chunks[0].lookup).toBe('猫')
    expect(session.chunks[1].lookup).toBe('好き')
    expect(session.chunks[1].furigana).toEqual([
      { text: '好', reading: 'す', kind: 'word' },
      { text: 'きです。' },
    ])
    expect(session.raw).toBe('cats | like')
    expect(session.sentenceNote).toHaveLength(2)
    expect(session.chunks.at(-1)?.jp).toBe('好きです。')
    expect(session.createdAt).toBe(now.toISOString())
    expect(session.id).toBe(`ai-${now.getTime()}`)
  })

  it('trims a lookup and omits an empty one', () => {
    const session = parseBreakdownResponse(
      JSON.stringify({
        ...breakdown,
        chunks: [
          { ...breakdown.chunks[0], lookup: '  猫  ' },
          { ...breakdown.chunks[1], lookup: '   ' },
        ],
      }),
      '猫が好きです。',
      now,
    )

    expect(session.chunks[0].lookup).toBe('猫')
    expect(session.chunks[1].lookup).toBeUndefined()
  })

  it('falls back to a plain natural translation when parts do not match', () => {
    const session = parseBreakdownResponse(
      JSON.stringify({
        ...breakdown,
        naturalParts: [{ text: 'I like', chunk: 1 }],
      }),
      '猫が好きです。',
      now,
    )

    expect(session.natural).toBe('I like cats.')
    expect(session.naturalParts).toBeUndefined()
  })

  it('drops furigana that does not cover the chunk text', () => {
    const session = parseBreakdownResponse(
      JSON.stringify({
        ...breakdown,
        chunks: breakdown.chunks.map((chunk, index) =>
          index === 0
            ? { ...chunk, furigana: [{ text: '猫', reading: 'ねこ', kind: 'word' }] }
            : chunk,
        ),
      }),
      '猫が好きです。',
      now,
    )

    expect(session.chunks[0].furigana).toBeUndefined()
    expect(session.chunks[1].furigana).toHaveLength(2)
  })

  it('keeps matching parts but drops unknown chunk references', () => {
    const session = parseBreakdownResponse(
      JSON.stringify({
        ...breakdown,
        naturalParts: [
          { text: 'I like ', chunk: 0 },
          { text: 'cats.', chunk: 99 },
        ],
      }),
      '猫が好きです。',
      now,
    )

    expect(session.naturalParts).toEqual([{ text: 'I like ' }, { text: 'cats.' }])
  })

  it('repairs missing spaces between natural parts', () => {
    const session = parseBreakdownResponse(
      JSON.stringify({
        ...breakdown,
        naturalParts: [
          { text: 'I', chunk: 0 },
          { text: 'like', chunk: 2 },
          { text: 'cats.', chunk: 1 },
        ],
      }),
      '猫が好きです。',
      now,
    )

    expect(session.naturalParts).toEqual([
      { text: 'I' },
      { text: ' like', chunk: 2 },
      { text: ' cats.', chunk: 1 },
    ])
  })

  it('rejects malformed model output', () => {
    expect(() => parseBreakdownResponse('not json', '猫が好きです。')).toThrowError(AiRequestError)
    expect(() => parseBreakdownResponse('{"chunks":[]}', '猫が好きです。')).toThrowError(
      /no usable chunks/,
    )
  })
})

describe('AI provider requests', () => {
  it('calls the OpenRouter endpoint with a bearer key and returns a session', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => openAiResponse(JSON.stringify(breakdown)))

    const session = await requestBreakdown({
      providerId: 'openrouter',
      model: 'openrouter/auto',
      key: 'sk-or-test',
      sentence: '猫が好きです。',
      fetchImpl: fetchMock,
      now,
    })

    expect(session.chunks).toHaveLength(2)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://openrouter.ai/api/v1/chat/completions')
    expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer sk-or-test')
    expect((init?.headers as Record<string, string>)['X-OpenRouter-Title']).toBe('Bunkai')
  })

  it('sends OpenCode requests to the supplied proxy endpoint', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => openAiResponse(JSON.stringify(breakdown)))

    await requestBreakdown({
      providerId: 'opencode',
      model: 'deepseek-v4.1-flash',
      key: 'opencode-test',
      proxyUrl: 'http://127.0.0.1:8787/v1/chat/completions',
      sentence: '猫が好きです。',
      fetchImpl: fetchMock,
    })

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('http://127.0.0.1:8787/v1/chat/completions')
    expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer opencode-test')
  })

  it('accepts an OpenCode proxy base URL and appends the chat path', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => openAiResponse(JSON.stringify(breakdown)))

    await requestBreakdown({
      providerId: 'opencode',
      model: 'deepseek-v4.1-flash',
      key: 'opencode-test',
      proxyUrl: 'http://127.0.0.1:8787/v1/',
      sentence: '猫が好きです。',
      fetchImpl: fetchMock,
    })

    const [url] = fetchMock.mock.calls[0]
    expect(url).toBe('http://127.0.0.1:8787/v1/chat/completions')
  })

  it('rejects unsafe proxy endpoints', () => {
    expect(() => normalizeProxyEndpoint('//evil.example/v1')).toThrowError(/HTTPS/)
    expect(() => normalizeProxyEndpoint('http://evil.example/v1')).toThrowError(/HTTPS/)
    expect(() => normalizeProxyEndpoint('https://user:pass@evil.example/v1')).toThrowError(
      /username or password/,
    )
    expect(() => normalizeProxyEndpoint('https://proxy.example/v1?x=1')).toThrowError(
      /query string/,
    )
  })

  it('canonicalizes an HTTPS proxy base', () => {
    expect(normalizeProxyEndpoint('https://proxy.example/v1/')).toBe(
      'https://proxy.example/v1/chat/completions',
    )
  })

  it('requires a proxy for OpenCode', async () => {
    const fetchMock = vi.fn<typeof fetch>()

    await expect(
      requestBreakdown({
        providerId: 'opencode',
        model: 'deepseek-v4.1-flash',
        key: 'opencode-test',
        sentence: '猫が好きです。',
        fetchImpl: fetchMock,
      }),
    ).rejects.toMatchObject({ kind: 'missing-proxy' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('uses the Anthropic messages request shape for Claude', async () => {
    const fetchMock = vi.fn<typeof fetch>(async (_, init) => {
      expect((init?.headers as Record<string, string>)['x-api-key']).toBe('sk-ant-test')
      expect((init?.headers as Record<string, string>)['anthropic-version']).toBe('2023-06-01')
      expect(
        (init?.headers as Record<string, string>)['anthropic-dangerous-direct-browser-access'],
      ).toBe('true')
      const body = JSON.parse(String(init?.body)) as Record<string, unknown>
      expect(body.system).toContain('Bunkai')
      expect(body.max_tokens).toBe(4000)
      return anthropicResponse(JSON.stringify(breakdown))
    })

    const session = await requestBreakdown({
      providerId: 'claude',
      model: 'claude-sonnet-4-6',
      key: 'sk-ant-test',
      sentence: '猫が好きです。',
      fetchImpl: fetchMock,
      now,
    })

    expect(session.chunks).toHaveLength(2)
    const [url] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.anthropic.com/v1/messages')
  })

  it('enriches an existing session with natural colors and furigana', async () => {
    const fetchMock = vi.fn<typeof fetch>(async (_, init) => {
      const body = JSON.parse(String(init?.body)) as Record<string, unknown>
      const messages = body.messages as Array<{ role: string; content: string }>
      expect(messages[0]?.content).toContain('enrich a saved Japanese breakdown')
      expect(body.max_tokens).toBeUndefined()

      return openAiResponse(
        JSON.stringify({
          naturalParts: [
            { text: 'I ', chunk: 0 },
            { text: 'like ', chunk: 2 },
            { text: 'cats.', chunk: 1 },
          ],
          chunks: [
            {
              n: 1,
              furigana: [{ text: '猫', reading: 'ねこ', kind: 'word' }, { text: 'が' }],
            },
            {
              n: 2,
              furigana: [{ text: '好', reading: 'す', kind: 'word' }, { text: 'きです' }],
            },
          ],
        }),
      )
    })

    const enrichment = await requestSessionEnrichment({
      providerId: 'openrouter',
      model: 'openrouter/auto',
      key: 'sk-or-test',
      sentence: '猫が好きです。',
      natural: 'I like cats.',
      chunks: breakdown.chunks.map((chunk, index) => ({ ...chunk, n: index + 1 })) as Chunk[],
      fetchImpl: fetchMock,
    })

    expect(enrichment.naturalParts).toEqual([
      { text: 'I ' },
      { text: 'like ', chunk: 2 },
      { text: 'cats.', chunk: 1 },
    ])
    expect(enrichment.furigana).toEqual([
      {
        n: 1,
        furigana: [{ text: '猫', reading: 'ねこ', kind: 'word' }, { text: 'が' }],
      },
      {
        n: 2,
        furigana: [{ text: '好', reading: 'す', kind: 'word' }, { text: 'きです' }],
      },
    ])
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('rejects an enrichment that yields nothing usable', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      openAiResponse(JSON.stringify({ naturalParts: [{ text: 'Wrong.', chunk: 1 }] })),
    )

    await expect(
      requestSessionEnrichment({
        providerId: 'openai',
        model: 'gpt-5.2',
        key: 'sk-test',
        sentence: '猫が好きです。',
        natural: 'I like cats.',
        chunks: breakdown.chunks as Chunk[],
        fetchImpl: fetchMock,
      }),
    ).rejects.toMatchObject({ kind: 'format' })
  })

  it('rejects an oversized provider response', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => openAiResponse('x'.repeat(300 * 1024)))

    await expect(
      requestBreakdown({
        providerId: 'openai',
        model: 'gpt-5.2',
        key: 'sk-test',
        sentence: '猫が好きです。',
        fetchImpl: fetchMock,
      }),
    ).rejects.toMatchObject({
      kind: 'format',
      message: expect.stringContaining('too much data'),
    })
  })

  it('maps auth, rate-limit, and network errors to plain-language failures', async () => {
    const authFetch = vi.fn<typeof fetch>(async () => new Response('', { status: 401 }))
    await expect(
      requestBreakdown({
        providerId: 'openai',
        model: 'gpt-5.2',
        key: 'bad',
        sentence: '猫が好きです。',
        fetchImpl: authFetch,
      }),
    ).rejects.toMatchObject({
      kind: 'invalid-key',
      message: expect.stringContaining('API key was rejected'),
    })

    const rateFetch = vi.fn<typeof fetch>(async () => new Response('', { status: 429 }))
    await expect(
      requestBreakdown({
        providerId: 'openrouter',
        model: 'openrouter/auto',
        key: 'bad',
        sentence: '猫が好きです。',
        fetchImpl: rateFetch,
      }),
    ).rejects.toMatchObject({ kind: 'rate-limit' })

    const networkFetch = vi.fn<typeof fetch>(async () => {
      throw new TypeError('Failed to fetch')
    })
    await expect(
      requestBreakdown({
        providerId: 'openai',
        model: 'gpt-5.2',
        key: 'bad',
        sentence: '猫が好きです。',
        fetchImpl: networkFetch,
      }),
    ).rejects.toMatchObject({ kind: 'network' })
  })

  it('checks a connection without logging the key', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const fetchMock = vi.fn<typeof fetch>(async () => openAiResponse('OK'))

    await testProviderConnection({
      providerId: 'openrouter',
      model: 'openrouter/auto',
      key: 'sk-or-secret-test',
      fetchImpl: fetchMock,
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(consoleSpy).not.toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})
