import type { Page, Request } from '@playwright/test'

const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, OPTIONS',
  'content-type': 'application/json',
}

export const EMPTY_TATOEBA = {
  data: [],
  paging: { total: 0, has_next: false },
}

export const TATOEBA_RESPONSE = {
  data: [
    {
      id: 10386401,
      text: '共有したい？',
      lang: 'jpn',
      license: 'CC BY 2.0 FR',
      owner: 'small_snow',
      is_unapproved: false,
      audios: [{ id: 201612, author: 'CK', license: 'CC BY-NC-ND 3.0' }],
      translations: [
        {
          id: 3333976,
          text: 'Do you want to share it?',
          lang: 'eng',
          license: 'CC BY 2.0 FR',
          owner: 'CK',
          is_unapproved: false,
          is_direct: true,
        },
      ],
    },
    {
      id: 100288,
      text: '彼は部屋を共有している。',
      lang: 'jpn',
      license: 'CC BY 2.0 FR',
      owner: null,
      is_unapproved: false,
      audios: [{ id: 999, author: 'someone', license: '' }],
      translations: [
        {
          id: 303409,
          text: 'He shares a room.',
          lang: 'eng',
          license: 'CC BY 2.0 FR',
          owner: 'CK',
          is_unapproved: false,
          is_direct: true,
        },
      ],
    },
    {
      id: 81801,
      text: '僕は彼と部屋を共有した。',
      lang: 'jpn',
      license: 'CC BY 2.0 FR',
      owner: 'CK',
      is_unapproved: false,
      audios: [],
      translations: [
        {
          id: 321914,
          text: 'I shared a room with him.',
          lang: 'eng',
          license: 'CC BY 2.0 FR',
          owner: 'CK',
          is_unapproved: false,
          is_direct: true,
        },
      ],
    },
    {
      id: 13535074,
      text: '安心して。',
      lang: 'jpn',
      license: 'CC BY 2.0 FR',
      owner: 'small_snow',
      is_unapproved: false,
      audios: [],
      translations: [
        {
          id: 28491,
          text: 'Set your mind at ease.',
          lang: 'eng',
          license: 'CC BY 2.0 FR',
          owner: 'CM',
          is_unapproved: false,
          is_direct: true,
        },
      ],
    },
    {
      id: 9001,
      text: '共有したくない。',
      lang: 'jpn',
      license: 'CC BY 2.0 FR',
      owner: 'CK',
      is_unapproved: false,
      audios: [],
      translations: [
        {
          id: 9002,
          text: 'I do not want to share.',
          lang: 'eng',
          license: 'CC BY 2.0 FR',
          owner: 'CK',
          is_unapproved: true,
          is_direct: true,
        },
      ],
    },
  ],
  paging: { total: 5, has_next: false },
}

export interface MockTatoebaOptions {
  body?: unknown
  status?: number
  delayMs?: number
  onRequest?: (request: Request) => void
}

export async function mockTatoeba(page: Page, options: MockTatoebaOptions = {}): Promise<void> {
  await page.unroute('https://api.tatoeba.org/**')

  await page.route('https://api.tatoeba.org/**', async (route) => {
    if (route.request().method() === 'OPTIONS') {
      try {
        await route.fulfill({ status: 204, headers: CORS_HEADERS })
      } catch {
        // The request may be aborted when the chunk changes.
      }
      return
    }

    options.onRequest?.(route.request())

    if (options.delayMs) {
      await new Promise((resolve) => setTimeout(resolve, options.delayMs))
    }

    try {
      await route.fulfill({
        status: options.status ?? 200,
        headers: CORS_HEADERS,
        body: JSON.stringify(options.body ?? EMPTY_TATOEBA),
      })
    } catch {
      // The request may be aborted when the chunk changes.
    }
  })
}

export async function mockTatoebaEmpty(page: Page): Promise<void> {
  await mockTatoeba(page, { body: EMPTY_TATOEBA })
}
