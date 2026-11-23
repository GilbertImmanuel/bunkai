import { describe, expect, it, vi } from 'vitest'
import {
  buildTatoebaAudioUrl,
  buildTatoebaSearchPageUrl,
  buildTatoebaSearchUrl,
  buildTatoebaSentenceUrl,
  mapTatoebaResponse,
  searchTatoeba,
} from './client'
import { TatoebaError } from './types'

function rawSentence(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 1,
    text: '共有したい？',
    lang: 'jpn',
    license: 'CC BY 2.0 FR',
    owner: 'small_snow',
    is_unapproved: false,
    audios: [],
    translations: [
      {
        id: 10,
        text: 'Do you want to share it?',
        lang: 'eng',
        license: 'CC BY 2.0 FR',
        owner: 'CK',
        is_unapproved: false,
        is_direct: true,
      },
    ],
    ...overrides,
  }
}

describe('Tatoeba URLs', () => {
  it('builds the search URL with required filters', () => {
    const url = new URL(buildTatoebaSearchUrl(' 共有 ', 10))

    expect(`${url.origin}${url.pathname}`).toBe('https://api.tatoeba.org/v1/sentences')
    expect(url.searchParams.get('lang')).toBe('jpn')
    expect(url.searchParams.get('q')).toBe('共有')
    expect(url.searchParams.get('sort')).toBe('relevance')
    expect(url.searchParams.get('limit')).toBe('10')
    expect(url.searchParams.get('is_unapproved')).toBe('no')
    expect(url.searchParams.get('trans:lang')).toBe('eng')
    expect(url.searchParams.get('trans:is_unapproved')).toBe('no')
    expect(url.searchParams.get('showtrans:lang')).toBe('eng')
    expect(url.searchParams.get('showtrans:is_unapproved')).toBe('no')
    expect(url.searchParams.get('include')).toBe('audios')
  })

  it('builds the public search, sentence, and audio URLs', () => {
    const search = new URL(buildTatoebaSearchPageUrl('共有'))
    expect(`${search.origin}${search.pathname}`).toBe('https://tatoeba.org/en/sentences/search')
    expect(search.searchParams.get('query')).toBe('共有')
    expect(search.searchParams.get('from')).toBe('jpn')
    expect(search.searchParams.get('to')).toBe('eng')

    expect(buildTatoebaSentenceUrl(1532832)).toBe('https://tatoeba.org/en/sentences/show/1532832')
    expect(buildTatoebaAudioUrl(137636)).toBe('https://api.tatoeba.org/v1/audios/137636/file')
  })
})

describe('Tatoeba response mapping', () => {
  it('maps an approved direct translation and sentence metadata', () => {
    const examples = mapTatoebaResponse({ data: [rawSentence()] }, { query: '共有' })

    expect(examples).toEqual([
      {
        jp: '共有したい？',
        en: 'Do you want to share it?',
        source: 'tatoeba',
        id: 1,
        url: 'https://tatoeba.org/en/sentences/show/1',
        author: 'small_snow',
        license: 'CC BY 2.0 FR',
      },
    ])
  })

  it('prefers a direct translation over an indirect one', () => {
    const examples = mapTatoebaResponse(
      {
        data: [
          rawSentence({
            translations: [
              {
                id: 1,
                text: 'Share it?',
                lang: 'eng',
                is_unapproved: false,
                is_direct: false,
              },
              {
                id: 2,
                text: 'Do you want to share it?',
                lang: 'eng',
                is_unapproved: false,
                is_direct: true,
              },
            ],
          }),
        ],
      },
      { query: '共有' },
    )

    expect(examples[0].en).toBe('Do you want to share it?')
  })

  it('falls back to an approved indirect translation', () => {
    const examples = mapTatoebaResponse(
      {
        data: [
          rawSentence({
            translations: [
              {
                id: 1,
                text: 'Share it?',
                lang: 'eng',
                is_unapproved: false,
                is_direct: false,
              },
            ],
          }),
        ],
      },
      { query: '共有' },
    )

    expect(examples[0].en).toBe('Share it?')
  })

  it('filters unapproved translations and missing translations', () => {
    expect(
      mapTatoebaResponse(
        {
          data: [
            rawSentence({
              translations: [
                {
                  id: 1,
                  text: 'Share it?',
                  lang: 'eng',
                  is_unapproved: true,
                  is_direct: true,
                },
              ],
            }),
          ],
        },
        { query: '共有' },
      ),
    ).toEqual([])

    expect(
      mapTatoebaResponse({ data: [rawSentence({ translations: [] })] }, { query: '共有' }),
    ).toEqual([])
  })

  it('maps licensed audio and ignores audio with an empty license', () => {
    const licensed = mapTatoebaResponse(
      {
        data: [
          rawSentence({
            audios: [
              {
                id: 20,
                author: 'yomi',
                license: 'CC BY-NC 4.0',
                download_url: 'https://api.tatoeba.org/v1/audio/20/file',
              },
            ],
          }),
        ],
      },
      { query: '共有' },
    )

    expect(licensed[0].audioUrl).toBe('https://api.tatoeba.org/v1/audios/20/file')
    expect(licensed[0].audioAuthor).toBe('yomi')
    expect(licensed[0].audioLicense).toBe('CC BY-NC 4.0')

    const unlicensed = mapTatoebaResponse(
      { data: [rawSentence({ audios: [{ id: 20, author: 'yomi', license: '' }] })] },
      { query: '共有' },
    )

    expect(unlicensed[0].audioUrl).toBeUndefined()
    expect(unlicensed[0].audioLicense).toBeUndefined()
  })

  it('requires the sentence to contain the query', () => {
    const examples = mapTatoebaResponse(
      {
        data: [
          rawSentence({
            id: 2,
            text: '安心して。',
            translations: [{ id: 3, text: 'Set your mind at ease.', lang: 'eng', is_direct: true }],
          }),
        ],
      },
      { query: '共有' },
    )

    expect(examples).toEqual([])
  })

  it('filters sentences outside the display length range', () => {
    const tooShort = mapTatoebaResponse(
      { data: [rawSentence({ text: '共有。' })] },
      { query: '共有' },
    )
    const tooLong = mapTatoebaResponse(
      { data: [rawSentence({ text: '共有'.repeat(21) })] },
      { query: '共有' },
    )

    expect(tooShort).toEqual([])
    expect(tooLong).toEqual([])
  })

  it('deduplicates by sentence id and normalized English text', () => {
    const sameId = mapTatoebaResponse(
      {
        data: [
          rawSentence(),
          rawSentence({
            text: '共有したいですか？',
            translations: [
              { id: 11, text: 'Do you want to share it', lang: 'eng', is_direct: true },
            ],
          }),
        ],
      },
      { query: '共有' },
    )

    expect(sameId).toHaveLength(1)

    const sameEnglish = mapTatoebaResponse(
      {
        data: [
          rawSentence(),
          rawSentence({
            id: 2,
            text: '共有したいですか？',
            translations: [
              {
                id: 12,
                text: 'Do you want to share it?',
                lang: 'eng',
                is_direct: true,
              },
            ],
          }),
        ],
      },
      { query: '共有' },
    )

    expect(sameEnglish).toHaveLength(1)
  })

  it('excludes the current session sentence', () => {
    const examples = mapTatoebaResponse(
      {
        data: [
          rawSentence(),
          rawSentence({
            id: 2,
            text: '共有したいですか？',
            translations: [
              {
                id: 13,
                text: 'Do you want to share it with someone?',
                lang: 'eng',
                is_direct: true,
              },
            ],
          }),
        ],
      },
      { query: '共有', exclude: '共有したい？' },
    )

    expect(examples).toHaveLength(1)
    expect(examples[0].id).toBe(2)
  })

  it('returns at most the requested number of examples', () => {
    const data = Array.from({ length: 5 }, (_, index) =>
      rawSentence({
        id: index + 1,
        text: `共有${'x'.repeat(index)}したい？`,
        translations: [
          {
            id: index + 10,
            text: `Share it ${index}.`,
            lang: 'eng',
            is_direct: true,
          },
        ],
      }),
    )

    expect(mapTatoebaResponse({ data }, { query: '共有', pick: 2 })).toHaveLength(2)
  })

  it('handles an empty response', () => {
    expect(mapTatoebaResponse({ data: [] }, { query: '共有' })).toEqual([])
  })

  it('rejects a malformed response', () => {
    expect(() => mapTatoebaResponse({}, { query: '共有' })).toThrow(TatoebaError)
  })
})

describe('Tatoeba search', () => {
  it('fetches and maps results', async () => {
    const mockFetch = vi.fn<typeof fetch>()
    mockFetch.mockImplementation(
      async () =>
        new Response(JSON.stringify({ data: [rawSentence()] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
    )
    const fetchImpl = mockFetch as unknown as typeof fetch

    const examples = await searchTatoeba({ query: '共有', fetchImpl })

    expect(examples).toHaveLength(1)
    expect(mockFetch).toHaveBeenCalledTimes(1)

    const url = new URL(String(mockFetch.mock.calls[0][0]))
    expect(url.searchParams.get('q')).toBe('共有')
    expect(url.searchParams.get('sort')).toBe('relevance')
  })

  it('returns an empty list for an empty query without fetching', async () => {
    const fetchImpl = vi.fn() as unknown as typeof fetch

    expect(await searchTatoeba({ query: '　', fetchImpl })).toEqual([])
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('maps HTTP failures', async () => {
    const fetchImpl = vi.fn(
      async () => new Response('{}', { status: 500 }),
    ) as unknown as typeof fetch

    await expect(searchTatoeba({ query: '共有', fetchImpl })).rejects.toMatchObject({
      kind: 'http',
      status: 500,
    })
  })

  it('rejects an oversized response', async () => {
    const fetchImpl = vi.fn(
      async () => new Response('x'.repeat(300 * 1024), { status: 200 }),
    ) as unknown as typeof fetch

    await expect(searchTatoeba({ query: '共有', fetchImpl })).rejects.toMatchObject({
      kind: 'format',
    })
  })

  it('maps unreadable JSON to a format error', async () => {
    const fetchImpl = vi.fn(
      async () => new Response('not json', { status: 200 }),
    ) as unknown as typeof fetch

    await expect(searchTatoeba({ query: '共有', fetchImpl })).rejects.toMatchObject({
      kind: 'format',
    })
  })

  it('maps network failures', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError('Failed to fetch')
    }) as unknown as typeof fetch

    await expect(searchTatoeba({ query: '共有', fetchImpl })).rejects.toMatchObject({
      kind: 'network',
    })
  })

  it('times out a hanging request', async () => {
    const fetchImpl = vi.fn(
      (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new Error('aborted')))
        }),
    ) as unknown as typeof fetch

    await expect(searchTatoeba({ query: '共有', fetchImpl, timeoutMs: 10 })).rejects.toMatchObject({
      kind: 'timeout',
    })
  })

  it('aborts when the caller signal is aborted', async () => {
    const controller = new AbortController()
    const fetchImpl = vi.fn(
      (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new Error('aborted')))
        }),
    ) as unknown as typeof fetch

    const pending = searchTatoeba({
      query: '共有',
      fetchImpl,
      signal: controller.signal,
    })
    controller.abort()

    await expect(pending).rejects.toMatchObject({ kind: 'aborted' })
  })
})
