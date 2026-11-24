import type { Page, Request } from '@playwright/test'
import { expect, test } from './fixtures'

const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'authorization,content-type,http-referer,x-openrouter-title',
}

const AI_BREAKDOWN = {
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
      note: '猫が marks the subject.',
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
      note: '好きです is the polite predicate.',
      construction: [{ jp: '好き + です', en: 'like (polite)' }],
      examples: [{ jp: '音楽が好きです。', en: 'I like music.' }],
      furigana: [{ text: '好', reading: 'す', kind: 'word' }, { text: 'きです' }],
    },
  ],
  sentenceNote: ['The subject is 猫が.', '好きです is the predicate.'],
}

const OPENAI_COMPLETION = {
  choices: [
    {
      message: {
        role: 'assistant',
        content: JSON.stringify(AI_BREAKDOWN),
      },
    },
  ],
}

const NAME_BREAKDOWN = {
  reading: 'たなかさんは・ねこが・すきです',
  natural: 'Mr. Tanaka likes cats.',
  naturalParts: [
    { text: 'Mr. Tanaka ', chunk: 1 },
    { text: 'likes ', chunk: 3 },
    { text: 'cats.', chunk: 2 },
  ],
  raw: 'Mr. Tanaka | cats | likes',
  chunks: [
    {
      jp: '田中さんは',
      kana: 'たなかさんは',
      gloss: 'Mr. Tanaka',
      role: 'topic',
      color: 1,
      note: '田中 is a surname; さんは marks the topic.',
      construction: [{ jp: '田中 + さん + は', en: 'Mr. Tanaka (topic)' }],
      examples: [{ jp: '田中さんは先生です。', en: 'Mr. Tanaka is a teacher.' }],
      furigana: [{ text: '田中', reading: 'たなか', kind: 'name' }, { text: 'さんは' }],
    },
    {
      jp: '猫が',
      kana: 'ねこが',
      gloss: 'cats',
      role: 'subject',
      color: 2,
      note: '猫が marks the subject of 好きです.',
      construction: [{ jp: '猫 + が', en: 'cats (subject)' }],
      examples: [{ jp: '猫が好きです。', en: 'I like cats.' }],
      furigana: [{ text: '猫', reading: 'ねこ', kind: 'word' }, { text: 'が' }],
    },
    {
      jp: '好きです',
      kana: 'すきです',
      gloss: 'likes',
      role: 'predicate',
      color: 3,
      note: '好きです is the polite predicate.',
      construction: [{ jp: '好き + です', en: 'like (polite)' }],
      examples: [{ jp: '音楽が好きです。', en: 'I like music.' }],
      furigana: [{ text: '好', reading: 'す', kind: 'word' }, { text: 'きです' }],
    },
  ],
  sentenceNote: ['田中さんは is the topic.', '猫が is the subject of 好きです.'],
}

const NAME_COMPLETION = {
  choices: [
    {
      message: {
        role: 'assistant',
        content: JSON.stringify(NAME_BREAKDOWN),
      },
    },
  ],
}

const OPENROUTER_SETTINGS = {
  provider: 'openrouter',
  keys: { openrouter: 'sk-or-v1-e2e-secret' },
  models: { openrouter: 'openrouter/auto' },
  proxies: {},
}

const OPENCODE_SETTINGS = {
  provider: 'opencode',
  keys: { opencode: 'opencode-e2e-secret' },
  models: { opencode: 'deepseek-v4.1-flash' },
  proxies: { opencode: '/opencode-proxy' },
}

async function primeAiSettings(page: Page, settings: unknown): Promise<void> {
  await page.addInitScript((value) => {
    localStorage.setItem('bunkai.ai', JSON.stringify(value))
  }, settings)
}

async function mockOpenRouter(
  page: Page,
  options: {
    status?: number
    body?: unknown
    delayMs?: number
    onRequest?: (request: Request) => void
  } = {},
): Promise<void> {
  await page.route('https://openrouter.ai/**', async (route) => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: CORS_HEADERS })
      return
    }

    options.onRequest?.(route.request())

    if (options.delayMs) {
      await new Promise((resolve) => setTimeout(resolve, options.delayMs))
    }

    await route.fulfill({
      status: options.status ?? 200,
      headers: { ...CORS_HEADERS, 'content-type': 'application/json' },
      body: JSON.stringify(options.body ?? {}),
    })
  })
}

async function mockOpenCodeProxy(
  page: Page,
  options: {
    status?: number
    body?: unknown
    onRequest?: (request: Request) => void
  } = {},
): Promise<void> {
  await page.route('**/opencode-proxy/**', async (route) => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: CORS_HEADERS })
      return
    }

    options.onRequest?.(route.request())

    await route.fulfill({
      status: options.status ?? 200,
      headers: { ...CORS_HEADERS, 'content-type': 'application/json' },
      body: JSON.stringify(options.body ?? {}),
    })
  })
}

function collectPageErrors(page: Page): string[] {
  const errors: string[] = []

  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text())
    }
  })
  page.on('pageerror', (error) => {
    errors.push(error.message)
  })

  return errors
}

async function expectSidebarState(page: Page, open: boolean): Promise<void> {
  await expect(page.getByTestId('breakdown-sidebar')).toHaveAttribute('data-open', String(open))

  const panel = page.getByTestId('sidebar-panel')
  const rail = page.getByTestId('sidebar-rail')

  if (open) {
    await expect(panel).not.toHaveAttribute('aria-hidden', 'true')
    await expect(rail).toHaveAttribute('aria-hidden', 'true')
  } else {
    await expect(panel).toHaveAttribute('aria-hidden', 'true')
    await expect(rail).not.toHaveAttribute('aria-hidden', 'true')
  }
}

async function settleMotion(page: Page): Promise<void> {
  await page.waitForTimeout(450)
}

test('home shell renders at 1280x800', async ({ page }) => {
  const consoleErrors = collectPageErrors(page)
  const googleFontRequests: string[] = []

  page.on('request', (request) => {
    if (/fonts\.(googleapis|gstatic)\.com/.test(request.url())) {
      googleFontRequests.push(request.url())
    }
  })

  await page.goto('/')

  await expect(page.getByTestId('app-shell')).toBeVisible()
  await expect(page.getByTestId('home-view')).toBeVisible()
  await expect(page.getByTestId('topbar')).toBeVisible()
  await expect(page.getByTestId('history-panel')).toBeVisible()
  await expect(page.getByTestId('breakdown-sidebar')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Save' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Toggle note' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /^Furigana:/ })).toHaveCount(0)
  await expect(
    page.getByRole('heading', { name: 'Read a sentence, see its pieces.' }),
  ).toBeVisible()
  await expect(page.locator('[data-history-id]')).toHaveCount(3)
  await expect(page.locator('.sample-card .chunk')).toHaveCount(6)
  await expect(page.getByRole('button', { name: 'Break down sentence' })).toBeDisabled()
  await expect(page.getByTestId('ai-status')).toContainText('Sample mode')

  expect(
    await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight + 1),
  ).toBe(true)

  const lightBg = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--bg').trim().toLowerCase(),
  )
  expect(lightBg).toBe('#e7dcc9')

  const fontLoaded = await page.evaluate(async () => {
    await document.fonts.load('22px "Shippori Mincho"', 'ただ心が動いた')
    return document.fonts.check('22px "Shippori Mincho"', 'ただ心が動いた')
  })
  expect(fontLoaded).toBe(true)
  expect(googleFontRequests).toEqual([])

  await page.screenshot({ path: 'test-results/home-1280x800.png' })

  await page.getByRole('textbox', { name: 'Search sessions' }).fill('居心地')
  await expect(page.locator('[data-history-id]')).toHaveCount(1)
  await page.getByRole('textbox', { name: 'Search sessions' }).fill('')
  await expect(page.locator('[data-history-id]')).toHaveCount(3)

  await page.setViewportSize({ width: 899, height: 800 })
  await expect(page.getByTestId('desktop-guard')).toBeVisible()
  await expect(page.getByTestId('app-shell')).toBeHidden()

  expect(consoleErrors).toEqual([])
})

test('rejects non-Japanese input with a toast', async ({ page }) => {
  await page.goto('/')

  const input = page.getByRole('textbox', { name: 'Japanese sentence' })
  await input.fill('Hello world.')
  await input.press('Enter')

  await expect(page.getByTestId('toast')).toContainText('does not look like Japanese')
  await expect(page.getByTestId('home-view')).toBeVisible()
  await expect(page.getByTestId('workspace-view')).toHaveCount(0)
  await expect(input).toHaveValue('Hello world.')
  await page.screenshot({ path: 'test-results/validation-toast-1280x800.png' })

  await input.fill('これはペンです。')
  await input.press('Enter')
  await expect(page.getByTestId('workspace-view')).toBeVisible()
})

test('clicking the sample opens the six-chunk workspace', async ({ page }) => {
  const consoleErrors = collectPageErrors(page)

  await page.goto('/')
  await page.getByTestId('sample-card').click()

  await expect(page.getByTestId('workspace-view')).toBeVisible()
  await expect(page.getByTestId('home-view')).toHaveCount(0)
  await expect(page.locator('[data-chunk]')).toHaveCount(6)
  await expect(page.getByTestId('breakdown-sidebar')).toBeVisible()
  await expect(page.locator('[data-chunk="5"]')).toHaveClass(/is-selected/)
  await expect(page.locator('[data-history-id="sample"]')).toHaveClass(/is-active/)
  await expect(page.getByRole('button', { name: 'Saved' })).toBeDisabled()
  await expect(page.getByRole('button', { name: /^Furigana:/ })).toBeVisible()

  expect(
    await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight + 1),
  ).toBe(true)

  await settleMotion(page)
  await page.screenshot({ path: 'test-results/workspace-1280x800.png' })

  await page.getByRole('button', { name: 'Collapse note' }).click()
  await expectSidebarState(page, false)
  await expect(page.getByTestId('sidebar-rail')).toBeVisible()
  await page.getByRole('button', { name: 'Expand breakdown' }).click()
  await expectSidebarState(page, true)

  await page.getByRole('button', { name: 'Start a new breakdown' }).click()
  await expect(page.getByTestId('home-view')).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Japanese sentence' })).toBeFocused()

  expect(consoleErrors).toEqual([])
})

test('furigana switches toggle name and word readings independently', async ({ page }) => {
  const consoleErrors = collectPageErrors(page)

  await page.goto('/')
  await page.getByTestId('sample-card').click()

  const sentence = page.locator('.sentence')
  const furiButton = page.getByRole('button', { name: /^Furigana:/ })
  const menu = page.getByTestId('furigana-menu')
  const nameSwitch = menu.getByRole('switch', { name: 'Name' })
  const wordSwitch = menu.getByRole('switch', { name: 'Furigana' })

  await expect(furiButton).toHaveAttribute('aria-label', 'Furigana: Name on, Furigana on')
  await expect(sentence.locator('rt')).toHaveCount(4)
  await expect(page.locator('[data-chunk="2"] rt').first()).toHaveText('こころ')

  const chunkHeights = await page
    .locator('[data-chunk]')
    .evaluateAll((elements) =>
      elements.map((element) => Math.round(element.getBoundingClientRect().height)),
    )
  expect(new Set(chunkHeights).size).toBe(1)

  await page.screenshot({ path: 'test-results/furigana-all-1280x800.png' })

  await furiButton.click()
  await expect(menu).toBeVisible()
  await expect(nameSwitch).toHaveAttribute('aria-checked', 'true')
  await expect(wordSwitch).toHaveAttribute('aria-checked', 'true')
  await expect(nameSwitch).toBeFocused()
  await page.screenshot({ path: 'test-results/furigana-menu-1280x800.png' })

  await page.keyboard.press('Escape')
  await expect(menu).toHaveCount(0)
  await expect(furiButton).toBeFocused()
  await expectSidebarState(page, true)

  await furiButton.click()
  await wordSwitch.click()
  await expect(wordSwitch).toHaveAttribute('aria-checked', 'false')
  await expect(furiButton).toHaveAttribute('aria-label', 'Furigana: Name on, Furigana off')
  await expect(sentence.locator('rt')).toHaveCount(0)

  await nameSwitch.click()
  await expect(nameSwitch).toHaveAttribute('aria-checked', 'false')
  await expect(furiButton).toHaveAttribute('aria-label', 'Furigana: Name off, Furigana off')

  await wordSwitch.click()
  await expect(wordSwitch).toHaveAttribute('aria-checked', 'true')
  await expect(sentence.locator('rt')).toHaveCount(4)
  await expect(furiButton).toHaveAttribute('aria-label', 'Furigana: Name off, Furigana on')

  await nameSwitch.click()
  await expect(nameSwitch).toHaveAttribute('aria-checked', 'true')
  await expect(sentence.locator('rt')).toHaveCount(4)

  await nameSwitch.click()
  await page.keyboard.press('Escape')
  await page.reload()

  await expect(page.getByTestId('workspace-view')).toBeVisible()
  await expect(page.locator('.sentence rt')).toHaveCount(4)
  await expect(page.getByRole('button', { name: 'Furigana: Name off, Furigana on' })).toBeVisible()

  expect(consoleErrors).toEqual([])
})

test('AI furigana separates name and word readings', async ({ page }) => {
  const consoleErrors = collectPageErrors(page)

  await primeAiSettings(page, OPENROUTER_SETTINGS)
  await mockOpenRouter(page, { body: NAME_COMPLETION })

  await page.goto('/')
  const input = page.getByRole('textbox', { name: 'Japanese sentence' })
  await input.fill('田中さんは猫が好きです。')
  await input.press('Enter')
  await expect(page.getByTestId('workspace-view')).toBeVisible()

  const chunk1 = page.locator('[data-chunk="1"]')
  const chunk2 = page.locator('[data-chunk="2"]')
  const chunk3 = page.locator('[data-chunk="3"]')
  const furiButton = page.getByRole('button', { name: /^Furigana:/ })
  const menu = page.getByTestId('furigana-menu')

  await expect(furiButton).toHaveAttribute('aria-label', 'Furigana: Name on, Furigana on')
  await expect(chunk1.locator('rt')).toHaveCount(1)
  await expect(chunk1.locator('rt')).toHaveText('たなか')
  await expect(chunk2.locator('rt')).toHaveText('ねこ')
  await expect(chunk3.locator('rt')).toHaveText('す')

  await furiButton.click()
  const nameSwitch = menu.getByRole('switch', { name: 'Name' })
  const wordSwitch = menu.getByRole('switch', { name: 'Furigana' })

  await wordSwitch.click()
  await expect(furiButton).toHaveAttribute('aria-label', 'Furigana: Name on, Furigana off')
  await expect(chunk1.locator('rt')).toHaveCount(1)
  await expect(chunk1.locator('rt')).toHaveText('たなか')
  await expect(chunk2.locator('rt')).toHaveCount(0)
  await expect(chunk3.locator('rt')).toHaveCount(0)

  await nameSwitch.click()
  await wordSwitch.click()
  await expect(furiButton).toHaveAttribute('aria-label', 'Furigana: Name off, Furigana on')
  await expect(chunk1.locator('rt')).toHaveCount(0)
  await expect(chunk2.locator('rt')).toHaveText('ねこ')
  await expect(chunk3.locator('rt')).toHaveText('す')

  await page.keyboard.press('Escape')
  await page.reload()
  await expect(page.getByTestId('workspace-view')).toBeVisible()
  await expect(chunk1.locator('rt')).toHaveCount(0)
  await expect(chunk2.locator('rt')).toHaveText('ねこ')
  await expect(furiButton).toHaveAttribute('aria-label', 'Furigana: Name off, Furigana on')

  expect(consoleErrors).toEqual([])
})

test('reading page shows the sentence map, literal key, and sentence note', async ({ page }) => {
  const consoleErrors = collectPageErrors(page)

  await page.goto('/')
  await page.getByTestId('sample-card').click()

  await expect(page.getByTestId('reading-sheet')).toBeVisible()
  await expect(page.getByTestId('kana')).toContainText('こころが')
  await expect(page.locator('[data-chunk]')).toHaveCount(6)

  for (let n = 1; n <= 6; n += 1) {
    await expect(page.locator(`[data-chunk="${n}"]`)).toHaveClass(new RegExp(`\\bc${n}\\b`))
  }

  await expect(page.getByTestId('map-topic')).toContainText('(zeroは)')
  await expect(page.getByTestId('map-core').locator('.map-node')).toHaveCount(6)
  await expect(page.getByTestId('map-core').locator('.map-node.is-head')).toContainText(
    '共有したくなった',
  )
  await expect(page.getByTestId('map-core').locator('.map-node.is-head')).toContainText('B-engine')
  await expect(page.getByTestId('map-rel')).toContainText('(zeroが)')
  await expect(page.getByTestId('map-rel')).toContainText('object')
  await expect(page.getByTestId('map-rel')).toContainText('だけ limits')

  await page.getByRole('button', { name: 'Tree' }).click()
  await expect(page.getByTestId('map-tree-core')).toContainText('(zeroが)')
  await expect(page.getByTestId('map-tree-core')).toContainText('共有したくなった')
  await expect(page.getByTestId('map-modifiers').locator('.map-modifier')).toHaveCount(5)
  await expect(page.getByTestId('map-modifiers')).toContainText('Time clause')
  await expect(page.getByTestId('map-modifiers')).toContainText('Companion')
  await expect(page.getByTestId('map-modifiers')).toContainText('Limiter')
  await expect(page.getByTestId('map-modifiers')).toContainText('だけ')
  await expect(page.getByTestId('map-modifiers')).toContainText('Modifiers of B-engine')
  await expect(page.getByTestId('map-modifiers').locator('.tree-list')).toBeVisible()
  await expect(page.locator('.tree-hint')).toContainText('Each branch modifies the node above it')
  await expect(page.locator('.tree-hint')).not.toContainText('·')
  await page.screenshot({ path: 'test-results/sentence-map-tree-1280x800.png' })

  await page.getByRole('button', { name: 'Row' }).click()
  await expect(page.getByTestId('map-core')).toBeVisible()
  await expect(page.getByTestId('map-tree-core')).toHaveCount(0)
  await expect(page.getByTestId('literal-key').locator('.key-row')).toHaveCount(6)
  const note = page.getByTestId('sentence-note')
  await expect(note.locator('.note-row')).toHaveCount(3)
  await expect(note.locator('.note-label')).toHaveText(['Core', 'Structure', 'Nuance'])
  await expect(note).toContainText('I just felt like sharing it')

  const underlineCount = await page
    .locator('[data-chunk]')
    .evaluateAll(
      (chunks) =>
        chunks.filter((chunk) => getComputedStyle(chunk).textDecorationLine !== 'none').length,
    )
  expect(underlineCount).toBe(0)

  const tooSmallLabels = await page.getByTestId('reading-sheet').evaluate(
    (root) =>
      Array.from(root.querySelectorAll<HTMLElement>('*')).filter((element) => {
        const size = Number.parseFloat(getComputedStyle(element).fontSize)
        return Number.isFinite(size) && size < 11
      }).length,
  )
  expect(tooSmallLabels).toBe(0)

  const horizontalOverflow = await page.evaluate(() => {
    const center = document.querySelector<HTMLElement>('.center-scroll')
    return {
      page: document.documentElement.scrollWidth > window.innerWidth + 1,
      center: center ? center.scrollWidth > center.clientWidth + 1 : false,
    }
  })
  expect(horizontalOverflow).toEqual({ page: false, center: false })

  await settleMotion(page)
  await page.screenshot({ path: 'test-results/reader-1280x800.png' })

  await page.getByTestId('sentence-note').scrollIntoViewIfNeeded()
  await page.screenshot({ path: 'test-results/reader-details-1280x800.png' })

  expect(consoleErrors).toEqual([])
})

test('controls use the printed shape scale, not capsule chrome', async ({ page }) => {
  await page.goto('/')

  const homeShape = await page.evaluate(() => {
    const corner = (selector: string): string => {
      const element = document.querySelector<HTMLElement>(selector)
      if (!element) throw new Error(`Missing ${selector}`)
      return getComputedStyle(element).borderTopLeftRadius
    }

    return {
      icon: corner('.topbar .icon-btn'),
      search: corner('.search'),
      send: corner('.combo-send'),
      sample: corner('[data-testid="sample-card"]'),
    }
  })

  expect(homeShape).toEqual({ icon: '4px', search: '4px', send: '4px', sample: '8px' })

  await page.getByTestId('sample-card').click()
  await expect(page.getByTestId('reading-sheet')).toBeVisible()

  const readerShape = await page.evaluate(() => {
    const corner = (selector: string): string => {
      const element = document.querySelector<HTMLElement>(selector)
      if (!element) throw new Error(`Missing ${selector}`)
      return getComputedStyle(element).borderTopLeftRadius
    }

    return {
      activeHistory: corner('.history-item.is-active'),
      sheet: corner('[data-testid="reading-sheet"]'),
      chunk: corner('[data-chunk="1"]'),
      trace: corner('[data-testid="construction-trace"] .trace-step'),
    }
  })

  expect(readerShape).toEqual({ activeHistory: '3px', sheet: '8px', chunk: '3px', trace: '6px' })

  await page.getByRole('button', { name: /Furigana: Name/ }).click()
  const switchShape = await page.getByTestId('furigana-menu').evaluate((menu) => {
    const track = menu.querySelector<HTMLElement>('.furi-track')
    const thumb = menu.querySelector<HTMLElement>('.furi-thumb')

    return {
      track: track ? getComputedStyle(track).borderTopLeftRadius : null,
      thumb: thumb ? getComputedStyle(thumb).borderTopLeftRadius : null,
    }
  })

  expect(switchShape).toEqual({ track: '3px', thumb: '1px' })
})

test('chunk details cite Cure Dolly and Tae Kim only when relevant', async ({ page }) => {
  const consoleErrors = collectPageErrors(page)

  await page.goto('/')
  await page.getByTestId('sample-card').click()

  const references = page.getByTestId('chunk-references')
  await references.scrollIntoViewIfNeeded()
  await expect(references).toContainText('Tae Kim, §4.7')
  await expect(references).toContainText('Tae Kim, §4.10')
  await expect(references.locator('.ref-item')).toHaveCount(2)
  await expect(references.locator('a')).toHaveCount(0)
  await expect(
    references.getByRole('link', { name: 'Cure Dolly transcript archive (GitHub)' }),
  ).toHaveCount(0)

  await page.locator('[data-chunk="3"]').click()
  await expect(references).toContainText('Cure Dolly, Lesson 47')
  await expect(references).toContainText('Tae Kim, §3.8')
  await expect(references.locator('.ref-item')).toHaveCount(2)
  await expect(references.locator('a')).toHaveCount(2)
  await expect(references.getByRole('link', { name: /^Cure Dolly, Lesson 47/ })).toHaveAttribute(
    'href',
    /youtube\.com/,
  )
  await expect(references.getByRole('link', { name: /^Cure Dolly, Lesson 47/ })).toHaveAttribute(
    'target',
    '_blank',
  )
  await expect(
    references.getByRole('link', { name: 'Cure Dolly transcript archive (GitHub)' }),
  ).toHaveAttribute('href', 'https://github.com/Kellenok/cure-script')
  await references.scrollIntoViewIfNeeded()
  await page.screenshot({ path: 'test-results/chunk-references-1280x800.png' })

  await page.locator('[data-chunk="1"]').click()
  await expect(references).toHaveCount(0)

  expect(consoleErrors).toEqual([])
})

test('translation defaults to raw, shares one font, and highlights natural meanings', async ({
  page,
}) => {
  const consoleErrors = collectPageErrors(page)

  await page.goto('/')
  await page.getByTestId('sample-card').click()

  const natural = page.getByRole('button', { name: 'Natural' })
  const raw = page.getByRole('button', { name: 'Raw' })
  const translation = page.getByTestId('translation-text')

  await expect(raw).toHaveAttribute('aria-pressed', 'true')
  await expect(natural).toHaveAttribute('aria-pressed', 'false')
  await expect(translation).toContainText('came to want to share')
  await expect(translation).toContainText('with someone')
  await expect(translation).toHaveCSS('opacity', '1')

  await page.screenshot({ path: 'test-results/reader-raw-1280x800.png' })

  await natural.click()
  await expect(natural).toHaveAttribute('aria-pressed', 'true')
  await expect(raw).toHaveAttribute('aria-pressed', 'false')
  await expect(translation).toContainText('I just felt like sharing')
  await expect(translation).toHaveCSS('font-style', 'normal')
  await expect(page.getByRole('button', { name: 'Add colors & readings' })).toHaveCount(0)

  await expect(translation.locator('.chunk.c1')).toHaveText('just')
  await expect(translation.locator('.chunk.c5')).toHaveText('felt like sharing')
  await expect(translation.locator('.chunk.c3')).toHaveText('it')
  await expect(translation.locator('.chunk.c4')).toHaveText('with someone')
  await expect(translation.locator('.chunk.c2')).toHaveText('when it moved me')
  await expect(translation.locator('.chunk.c6')).toHaveText('— that’s all.')

  const naturalOrder = await translation
    .locator('.chunk')
    .evaluateAll((elements) =>
      elements.map((element) => [...element.classList].find((name) => /^c[1-6]$/.test(name))),
    )
  expect(naturalOrder).toEqual(['c1', 'c5', 'c3', 'c4', 'c2', 'c6'])

  const naturalFont = await translation.evaluate((element) => {
    const style = getComputedStyle(element)
    return { family: style.fontFamily, size: style.fontSize, style: style.fontStyle }
  })

  await page.screenshot({ path: 'test-results/reader-natural-1280x800.png' })

  await raw.click()
  await expect(raw).toHaveAttribute('aria-pressed', 'true')
  await expect(translation).toContainText('came to want to share')

  const rawFont = await translation.evaluate((element) => {
    const style = getComputedStyle(element)
    return { family: style.fontFamily, size: style.fontSize, style: style.fontStyle }
  })
  expect(rawFont).toEqual(naturalFont)

  await page.locator('[data-chunk="2"]').click()
  await expect(page.locator('[data-chunk="2"]')).toHaveClass(/is-selected/)
  await expect(page.locator('[data-chunk="5"]')).not.toHaveClass(/is-selected/)
  await expect(page.getByTestId('breakdown-sidebar')).toContainText('Chunk 02')
  await expect(page.getByTestId('breakdown-sidebar')).toContainText('心が動いたときに')
  await expect(page.locator('.center-meta')).toContainText('02 selected')

  for (let n = 1; n <= 6; n += 1) {
    await page.keyboard.press(String(n))
    await expect(page.locator(`[data-chunk="${n}"]`)).toHaveClass(/is-selected/)
  }

  await expect(raw).toHaveAttribute('aria-pressed', 'true')
  await expect(translation).toContainText('came to want to share')

  expect(consoleErrors).toEqual([])
})

test('breakdown sidebar shows role, construction, examples, and grammar note', async ({ page }) => {
  const consoleErrors = collectPageErrors(page)

  await page.goto('/')
  await page.getByTestId('sample-card').click()

  const panel = page.getByTestId('sidebar-panel')
  const body = page.getByTestId('sidebar-body')

  await expect(panel).toBeVisible()
  await expect(panel).toContainText('Chunk 05')
  await expect(panel).toContainText('共有したくなった')
  await expect(panel).toContainText('きょうゆうしたくなった')
  await expect(panel).toContainText('came to want to share')
  await expect(panel).toContainText('main verb')
  await expect(panel).not.toContainText('I just felt like sharing')

  const traceSteps = page.getByTestId('construction-trace').locator('.trace-step')
  await expect(traceSteps).toHaveCount(4)
  await expect(traceSteps.last()).toHaveClass(/is-final/)
  await expect(page.getByTestId('examples').locator('.example')).toHaveCount(3)
  await expect(page.getByTestId('grammar-note')).toContainText('〜たくなった')
  await expect(page.getByTestId('sidebar-pager')).toHaveText('05 / 06')

  const bodyMetrics = await body.evaluate((element) => ({
    overflowY: getComputedStyle(element).overflowY,
    scrollable: element.scrollHeight > element.clientHeight,
  }))
  expect(bodyMetrics.overflowY).toBe('auto')
  expect(bodyMetrics.scrollable).toBe(true)

  await settleMotion(page)
  await page.screenshot({ path: 'test-results/sidebar-1280x800.png' })

  await body.evaluate((element) => {
    element.scrollTop = element.scrollHeight
  })
  await page.locator('[data-chunk="2"]').click()
  await expect(panel).toContainText('Chunk 02')
  await expect.poll(() => body.evaluate((element) => element.scrollTop)).toBe(0)

  expect(consoleErrors).toEqual([])
})

test('sidebar collapses, reopens, and responds to Escape and Enter', async ({ page }) => {
  const consoleErrors = collectPageErrors(page)

  await page.goto('/')
  await page.getByTestId('sample-card').click()

  const panel = page.getByTestId('sidebar-panel')
  const rail = page.getByTestId('sidebar-rail')

  await expectSidebarState(page, true)

  await page.locator('[data-chunk="5"]').click()
  await expectSidebarState(page, false)
  await expect(rail).toBeVisible()
  await settleMotion(page)

  await page.screenshot({ path: 'test-results/sidebar-collapsed-1280x800.png' })

  await page.locator('[data-chunk="5"]').click()
  await expectSidebarState(page, true)

  await page.keyboard.press('Escape')
  await expectSidebarState(page, false)
  await expect(rail).toBeVisible()

  await page.keyboard.press('Enter')
  await expectSidebarState(page, true)

  await panel.getByRole('button', { name: 'Collapse note' }).click()
  await expectSidebarState(page, false)
  await page.getByRole('button', { name: 'Expand breakdown' }).click()
  await expectSidebarState(page, true)

  expect(consoleErrors).toEqual([])
})

test('sidebar pager moves between chunks', async ({ page }) => {
  const consoleErrors = collectPageErrors(page)

  await page.goto('/')
  await page.getByTestId('sample-card').click()

  const panel = page.getByTestId('sidebar-panel')
  const pager = page.getByTestId('sidebar-pager')
  const next = panel.getByRole('button', { name: 'Next chunk' })
  const prev = panel.getByRole('button', { name: 'Previous chunk' })

  await expect(pager).toHaveText('05 / 06')
  await next.click()
  await expect(panel).toContainText('Chunk 06')
  await expect(pager).toHaveText('06 / 06')
  await expect(next).toBeDisabled()
  await expect(prev).toBeEnabled()

  await prev.click()
  await expect(panel).toContainText('Chunk 05')
  await expect(pager).toHaveText('05 / 06')

  expect(consoleErrors).toEqual([])
})

test('sidebar opens as a drawer at 1024px', async ({ page }) => {
  const consoleErrors = collectPageErrors(page)

  await page.setViewportSize({ width: 1024, height: 800 })
  await page.goto('/')
  await page.getByTestId('sample-card').click()

  const panel = page.getByTestId('sidebar-panel')
  const rail = page.getByTestId('sidebar-rail')
  const scrim = page.getByTestId('drawer-scrim')

  await expect(page.getByTestId('workspace-view')).toBeVisible()
  await expectSidebarState(page, false)
  await expect(rail).toBeVisible()

  await page.locator('[data-chunk="2"]').click()
  await expectSidebarState(page, true)
  await expect(panel).toHaveAttribute('role', 'dialog')
  await expect(scrim).toBeVisible()
  await expect
    .poll(() => page.evaluate(() => document.activeElement?.getAttribute('aria-label')))
    .toBe('Collapse note')

  await settleMotion(page)

  const historyBox = await page.getByTestId('history-panel').boundingBox()
  const panelBox = await panel.boundingBox()
  const scrimBox = await scrim.boundingBox()
  expect(historyBox).not.toBeNull()
  expect(panelBox).not.toBeNull()
  expect(scrimBox).not.toBeNull()
  expect(panelBox!.x).toBeGreaterThanOrEqual(historyBox!.x + historyBox!.width)
  expect(scrimBox!.x).toBeGreaterThanOrEqual(historyBox!.x + historyBox!.width)

  await page.screenshot({ path: 'test-results/sidebar-drawer-1024x800.png' })

  await page.keyboard.press('Escape')
  await expectSidebarState(page, false)
  await expect(rail).toBeVisible()
  await expect(page.locator('[data-chunk="2"]')).toBeFocused()

  const expand = page.getByRole('button', { name: 'Expand breakdown' })
  await expand.click()
  await expectSidebarState(page, true)
  await scrim.click()
  await expectSidebarState(page, false)
  await expect(rail).toBeVisible()
  await expect(expand).toBeFocused()

  await page.getByRole('button', { name: 'Expand breakdown' }).click()
  await expectSidebarState(page, true)

  expect(consoleErrors).toEqual([])
})

test('clicking a history item loads that session', async ({ page }) => {
  const consoleErrors = collectPageErrors(page)

  await page.goto('/')
  await expect(page.locator('[data-history-id]')).toHaveCount(3)

  await page.getByTestId('sample-card').click()
  await expect(page.locator('[data-chunk="2"]')).toHaveAttribute('aria-label', '心が動いたときに')

  const center = page.locator('.center-scroll')
  await center.evaluate((element) => {
    element.scrollTop = element.scrollHeight
  })
  await expect.poll(() => center.evaluate((element) => element.scrollTop)).toBeGreaterThan(0)

  const sessionB = page.locator('[data-history-id="s-b"]')
  await sessionB.click()

  await expect(page.getByTestId('workspace-view')).toBeVisible()
  await expect(page.locator('[data-chunk="2"]')).toHaveAttribute('aria-label', '居心地が')
  await expect(page.locator('[data-chunk="3"]')).toHaveAttribute('aria-label', '悪そう')
  await expect(page.locator('[data-chunk]')).toHaveCount(3)
  await expect(sessionB).toHaveClass(/is-active/)
  await expect(sessionB).toHaveAttribute('aria-current', 'true')
  await expect(page.locator('[data-history-id="sample"]')).not.toHaveAttribute(
    'aria-current',
    'true',
  )
  await expect(page.getByRole('button', { name: 'Saved' })).toBeDisabled()
  await expect.poll(() => center.evaluate((element) => element.scrollTop)).toBe(0)

  expect(consoleErrors).toEqual([])
})

test('saving a pasted session persists it in history after reload', async ({ page }) => {
  const consoleErrors = collectPageErrors(page)

  await page.goto('/')
  await expect(page.locator('[data-history-id]')).toHaveCount(3)

  const input = page.getByRole('textbox', { name: 'Japanese sentence' })
  await input.fill('保存テストの文です。')
  await input.press('Enter')
  await expect(page.getByTestId('workspace-view')).toBeVisible()

  const save = page.getByRole('button', { name: 'Save' })
  await expect(save).toBeEnabled()
  await save.click()

  const toast = page.getByTestId('toast')
  await expect(toast).toBeVisible()
  await expect(toast).toContainText('Saved to history')
  await expect(toast).toHaveCSS('opacity', '1')
  await expect(page.getByRole('button', { name: 'Saved' })).toBeDisabled()
  await expect(page.locator('[data-history-id]')).toHaveCount(4)

  await page.screenshot({ path: 'test-results/history-save-toast-1280x800.png' })

  await page.reload()

  await expect(page.getByTestId('workspace-view')).toBeVisible()
  await expect(page.getByTestId('reading-sheet')).toContainText('保存テストの文です。')
  await expect(page.locator('[data-history-id]')).toHaveCount(4)
  await expect(page.locator('.history-item.is-active')).toContainText('保存テストの文です。')
  await expect(page.getByRole('button', { name: 'Saved' })).toBeDisabled()

  expect(consoleErrors).toEqual([])
})

test('save undo removes the session and clears the saved last session', async ({ page }) => {
  const consoleErrors = collectPageErrors(page)

  await page.goto('/')
  await expect(page.locator('[data-history-id]')).toHaveCount(3)

  const input = page.getByRole('textbox', { name: 'Japanese sentence' })
  await input.fill('取り消しテストの文です。')
  await input.press('Enter')

  await page.getByRole('button', { name: 'Save' }).click()
  const toast = page.getByTestId('toast')
  await expect(toast).toContainText('Saved to history')
  await expect(page.locator('[data-history-id]')).toHaveCount(4)

  await toast.getByRole('button', { name: 'Undo' }).click()

  await expect(page.getByTestId('toast')).toHaveCount(0)
  await expect(page.locator('[data-history-id]')).toHaveCount(3)
  await expect(page.getByRole('button', { name: 'Save' })).toBeEnabled()

  await page.reload()
  await expect(page.getByTestId('home-view')).toBeVisible()
  await expect(page.locator('[data-history-id]')).toHaveCount(3)

  expect(consoleErrors).toEqual([])
})

test('translation mode and sidebar layout persist after reload', async ({ page }) => {
  const consoleErrors = collectPageErrors(page)

  await page.goto('/')
  await page.getByTestId('sample-card').click()

  await page.getByRole('button', { name: 'Natural' }).click()
  await page.getByRole('button', { name: 'Collapse note' }).click()
  await expectSidebarState(page, false)
  await expect(page.getByTestId('sidebar-rail')).toBeVisible()

  await page.reload()

  await expect(page.getByTestId('workspace-view')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Natural' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expectSidebarState(page, false)
  await expect(page.getByTestId('sidebar-rail')).toBeVisible()

  expect(consoleErrors).toEqual([])
})

test('desktop breakpoints render without clipping', async ({ page }) => {
  test.setTimeout(60_000)
  const consoleErrors = collectPageErrors(page)
  const widths = [900, 1024, 1099, 1100, 1200, 1279, 1280, 1440, 1536, 1600, 1920]

  await page.goto('/')

  for (const width of widths) {
    await page.setViewportSize({ width, height: 800 })
    await page.evaluate(() => {
      localStorage.removeItem('bunkai.layout')
      localStorage.removeItem('bunkai.lastSession')
    })
    await page.reload()
    await expect(page.getByTestId('home-view')).toBeVisible()
    await page.getByTestId('sample-card').click()
    await expect(page.getByTestId('workspace-view')).toBeVisible()
    await expect(page.locator('[data-chunk]')).toHaveCount(6)

    const expectedHistory = width >= 1280 ? 240 : 56
    const expectedSidebar = width >= 1100 ? (width >= 1440 ? 320 : 300) : 44

    await expect
      .poll(async () => (await page.getByTestId('breakdown-sidebar').boundingBox())?.width ?? 0)
      .toBeCloseTo(expectedSidebar, 0)
    await expect
      .poll(async () => (await page.getByTestId('history-panel').boundingBox())?.width ?? 0)
      .toBeCloseTo(expectedHistory, 0)

    const metrics = await page.evaluate(() => {
      const rect = (selector: string): DOMRect | undefined =>
        document.querySelector(selector)?.getBoundingClientRect()
      const history = rect('[data-testid="history-panel"]')
      const sidebar = rect('[data-testid="breakdown-sidebar"]')
      const sidebarEl = document.querySelector('[data-testid="breakdown-sidebar"]')
      const center = rect('main.center')
      const sheet = rect('[data-testid="reading-sheet"]')
      const topbar = rect('[data-testid="topbar"]')
      const meta = rect('.center-meta')
      const centerScroll = document.querySelector<HTMLElement>('.center-scroll')
      const chunks = Array.from(document.querySelectorAll('[data-chunk]')).map((element) =>
        element.getBoundingClientRect(),
      )
      const lines = new Map<number, number>()
      for (const chunk of chunks) {
        const key = Math.round(chunk.top)
        lines.set(key, (lines.get(key) ?? 0) + 1)
      }
      const previous = chunks.at(-2)
      const last = chunks.at(-1)
      const lastLineCount = last ? (lines.get(Math.round(last.top)) ?? 0) : 0
      const orphanedLast = Boolean(
        last && previous && Math.round(last.top) > Math.round(previous.top) && lastLineCount === 1,
      )
      const keyList = document.querySelector('[data-testid="literal-key"] .key-list')
      const mapCore = document.querySelector('[data-testid="sentence-map"] .map-core')
      const trackCount = (element: Element | null): number =>
        element
          ? getComputedStyle(element).gridTemplateColumns.split(' ').filter(Boolean).length
          : 0

      return {
        pageOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
        centerOverflow: centerScroll
          ? centerScroll.scrollWidth > centerScroll.clientWidth + 1
          : false,
        historyWidth: history?.width ?? 0,
        sidebarWidth: sidebar?.width ?? 0,
        centerWidth: center?.width ?? 0,
        sheetFits: Boolean(
          center && sheet && sheet.left >= center.left && sheet.right <= center.right + 1,
        ),
        topbarFits: Boolean(topbar && topbar.right <= window.innerWidth + 1),
        metaFits: Boolean(meta && meta.right <= window.innerWidth + 1),
        keyColumns: trackCount(keyList),
        mapColumns: trackCount(mapCore),
        orphanedLast,
        sidebarOpen: sidebarEl?.getAttribute('data-open') === 'true',
      }
    })

    expect(metrics.pageOverflow, `page overflow at ${width}`).toBe(false)
    expect(metrics.centerOverflow, `center overflow at ${width}`).toBe(false)
    expect(metrics.historyWidth, `history width at ${width}`).toBeCloseTo(expectedHistory, 0)
    expect(metrics.sidebarWidth, `sidebar width at ${width}`).toBeCloseTo(expectedSidebar, 0)
    expect(metrics.centerWidth, `center width at ${width}`).toBeCloseTo(
      width - expectedHistory - expectedSidebar,
      0,
    )
    expect(metrics.sheetFits, `sheet fits at ${width}`).toBe(true)
    expect(metrics.topbarFits, `topbar fits at ${width}`).toBe(true)
    expect(metrics.metaFits, `meta fits at ${width}`).toBe(true)
    expect(metrics.keyColumns, `key columns at ${width}`).toBe(width <= 900 ? 1 : 2)
    expect(metrics.mapColumns, `map columns at ${width}`).toBe(width <= 900 ? 1 : 6)
    expect(metrics.orphanedLast, `orphaned last chunk at ${width}`).toBe(false)
    expect(metrics.sidebarOpen, `sidebar open state at ${width}`).toBe(width >= 1100)

    await settleMotion(page)
    await page.screenshot({ path: `test-results/responsive-${width}x800.png` })
  }

  expect(consoleErrors).toEqual([])
})

test('history rail expands on demand below 1280', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 800 })
  await page.goto('/')
  await expect(page.getByTestId('home-view')).toBeVisible()

  const history = page.getByTestId('history-panel')
  await expect.poll(async () => (await history.boundingBox())?.width ?? 0).toBeCloseTo(56, 0)

  await page.getByRole('button', { name: 'Expand history' }).click()
  await expect(page.getByRole('button', { name: 'Collapse history' })).toBeVisible()
  await expect.poll(async () => (await history.boundingBox())?.width ?? 0).toBeCloseTo(240, 0)

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  )
  expect(overflow).toBe(false)
  await page.screenshot({ path: 'test-results/history-expanded-1200x800.png' })

  await page.getByRole('button', { name: 'Collapse history' }).click()
  await expect.poll(async () => (await history.boundingBox())?.width ?? 0).toBeCloseTo(56, 0)
})

test('resizing down collapses history and closes the sidebar', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  await page.getByTestId('sample-card').click()

  const history = page.getByTestId('history-panel')
  await expectSidebarState(page, true)
  await expect.poll(async () => (await history.boundingBox())?.width ?? 0).toBeCloseTo(240, 0)

  await page.setViewportSize({ width: 1024, height: 800 })

  await expectSidebarState(page, false)
  await expect(page.getByTestId('sidebar-rail')).toBeVisible()
  await expect.poll(async () => (await history.boundingBox())?.width ?? 0).toBeCloseTo(56, 0)

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  )
  expect(overflow).toBe(false)
  await settleMotion(page)
  await page.screenshot({ path: 'test-results/responsive-resized-1024x800.png' })
})

test('pasting a sentence and pressing Enter opens a placeholder workspace', async ({ page }) => {
  const consoleErrors = collectPageErrors(page)

  await page.goto('/')

  const input = page.getByRole('textbox', { name: 'Japanese sentence' })
  const send = page.getByRole('button', { name: 'Break down sentence' })
  await expect(send).toBeDisabled()

  await input.fill('日本語を勉強しています。')
  await expect(send).toBeEnabled()
  await input.press('Enter')

  await expect(page.getByTestId('ai-loading')).toContainText('Preparing workspace…')
  await expect(page.getByRole('button', { name: 'Building breakdown' })).toBeVisible()

  await expect(page.getByTestId('workspace-view')).toBeVisible()
  await expect(page.locator('[data-chunk]')).toHaveCount(1)
  await expect(
    page.getByText('Full chunking for pasted sentences arrives in a later phase.').first(),
  ).toBeVisible()

  expect(consoleErrors).toEqual([])
})

test('history falls back to memory when IndexedDB is unavailable', async ({ page }) => {
  const consoleErrors = collectPageErrors(page)

  await page.addInitScript(() => {
    Object.defineProperty(globalThis, 'indexedDB', {
      configurable: true,
      get() {
        throw new Error('IndexedDB disabled for this test')
      },
    })
  })

  await page.goto('/')

  await expect(page.getByText('History is available for this tab only.')).toBeVisible()
  await expect(page.locator('[data-history-id]')).toHaveCount(3)

  const input = page.getByRole('textbox', { name: 'Japanese sentence' })
  await input.fill('メモリ保存の文です。')
  await input.press('Enter')
  await page.getByRole('button', { name: 'Save' }).click()

  await expect(page.getByTestId('toast')).toContainText('Saved for this tab only')
  await expect(page.locator('[data-history-id]')).toHaveCount(4)
  await expect(page.getByRole('button', { name: 'Saved' })).toBeDisabled()

  expect(consoleErrors).toEqual([])
})

test('sidebar motion settles and respects reduced motion', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('sample-card').click()

  const panel = page.getByTestId('sidebar-panel')
  const rail = page.getByTestId('sidebar-rail')

  await page.getByRole('button', { name: 'Collapse note' }).click()
  await expectSidebarState(page, false)
  await expect.poll(() => panel.evaluate((element) => getComputedStyle(element).opacity)).toBe('0')
  await expect.poll(() => rail.evaluate((element) => getComputedStyle(element).opacity)).toBe('1')

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.getByRole('button', { name: 'Expand breakdown' }).click()
  await expectSidebarState(page, true)
  expect(await panel.evaluate((element) => getComputedStyle(element).opacity)).toBe('1')

  await page.getByRole('button', { name: 'Collapse note' }).click()
  await expectSidebarState(page, false)
  expect(await panel.evaluate((element) => getComputedStyle(element).opacity)).toBe('0')
})

test('dark mode renders reader, sidebar, examples, and toast', async ({ page }) => {
  const consoleErrors = collectPageErrors(page)

  await page.goto('/')
  await page.getByRole('button', { name: 'Switch to dark theme' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

  await page.getByTestId('sample-card').click()
  await expect(page.getByTestId('workspace-view')).toBeVisible()
  await expect(page.locator('[data-chunk]')).toHaveCount(6)

  const darkStyles = await page.evaluate(() => {
    const sheet = document.querySelector<HTMLElement>('[data-testid="reading-sheet"]')
    const kana = document.querySelector<HTMLElement>('[data-testid="kana"]')
    return {
      bg: getComputedStyle(document.documentElement).getPropertyValue('--bg').trim().toLowerCase(),
      sheet: sheet ? getComputedStyle(sheet).backgroundColor : '',
      kanaSize: kana ? getComputedStyle(kana).fontSize : '',
      kanaColor: kana ? getComputedStyle(kana).color : '',
    }
  })

  expect(darkStyles.bg).toBe('#12100e')
  expect(darkStyles.sheet).toBe('rgb(29, 26, 22)')
  expect(darkStyles.kanaSize).toBe('15px')
  expect(darkStyles.kanaColor).toBe('rgb(216, 208, 194)')

  const sidebar = page.getByTestId('sidebar-panel')
  await expect(sidebar).toContainText('Chunk 05')
  const tooSmallInSidebar = await sidebar.evaluate(
    (root) =>
      Array.from(root.querySelectorAll<HTMLElement>('*')).filter((element) => {
        const size = Number.parseFloat(getComputedStyle(element).fontSize)
        return Number.isFinite(size) && size < 11
      }).length,
  )
  expect(tooSmallInSidebar).toBe(0)

  await settleMotion(page)
  await page.screenshot({ path: 'test-results/dark-reader-1280x800.png' })

  await page.getByTestId('examples').scrollIntoViewIfNeeded()
  await page.screenshot({ path: 'test-results/dark-sidebar-examples-1280x800.png' })

  await page.getByRole('button', { name: 'Start a new breakdown' }).click()
  const input = page.getByRole('textbox', { name: 'Japanese sentence' })
  await input.fill('ダークモードの保存テストです。')
  await input.press('Enter')
  await page.getByRole('button', { name: 'Save' }).click()

  const toast = page.getByTestId('toast')
  await expect(toast).toContainText('Saved to history')
  await expect(toast).toHaveCSS('opacity', '1')
  const toastStyles = await toast.evaluate((element) => ({
    background: getComputedStyle(element).backgroundColor,
    color: getComputedStyle(element).color,
  }))
  expect(toastStyles.background).toBe('rgb(38, 34, 29)')
  expect(toastStyles.color).toBe('rgb(244, 238, 227)')
  await expect(toast.getByRole('button', { name: 'Undo' })).toHaveCSS('color', 'rgb(156, 197, 232)')

  await page.screenshot({ path: 'test-results/dark-toast-1280x800.png' })

  expect(consoleErrors).toEqual([])
})

test('dark drawer renders at 1024 and uses a dark scrim', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 800 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Switch to dark theme' }).click()
  await page.getByTestId('sample-card').click()

  const panel = page.getByTestId('sidebar-panel')
  await expectSidebarState(page, false)
  await page.locator('[data-chunk="2"]').click()
  await expectSidebarState(page, true)
  await expect(panel).toHaveAttribute('role', 'dialog')

  const scrim = page.getByTestId('drawer-scrim')
  await expect(scrim).toBeVisible()
  await settleMotion(page)

  const drawerStyles = await page.evaluate(() => {
    const panelEl = document.querySelector<HTMLElement>('[data-testid="sidebar-panel"]')
    const scrimEl = document.querySelector<HTMLElement>('[data-testid="drawer-scrim"]')
    return {
      panelBg: panelEl ? getComputedStyle(panelEl).backgroundColor : '',
      panelBorder: panelEl ? getComputedStyle(panelEl).borderLeftColor : '',
      scrim: scrimEl ? getComputedStyle(scrimEl).backgroundColor : '',
    }
  })

  expect(drawerStyles.panelBg).toBe('rgb(38, 34, 29)')
  expect(drawerStyles.panelBorder).toBe('rgb(122, 112, 98)')
  expect(drawerStyles.scrim).toBe('rgba(0, 0, 0, 0.52)')

  await page.screenshot({ path: 'test-results/dark-drawer-1024x800.png' })
})

test('AI settings save, test, hide, and remove the key', async ({ page }) => {
  const consoleErrors = collectPageErrors(page)
  const consoleMessages: string[] = []
  const secret = 'sk-or-v1-settings-secret'
  page.on('console', (message) => consoleMessages.push(message.text()))

  await mockOpenRouter(page, { body: {} })
  await page.goto('/')

  await page.getByTestId('settings-toggle').click()
  const drawer = page.getByTestId('ai-settings')
  await expect(drawer).toBeVisible()
  await expect(drawer).toContainText('Stored only in this browser')

  await drawer.getByLabel('API key').fill(secret)
  await drawer.getByRole('button', { name: 'Test connection' }).click()
  await expect(drawer).toContainText('Connection works.')

  await drawer.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(drawer).toContainText('Saved in this browser. AI is ready.')
  await expect(drawer.getByLabel('API key')).toHaveValue('')
  await expect(drawer.getByLabel('API key')).toHaveAttribute('placeholder', /Key saved/)
  await expect(drawer.getByLabel('Model')).toHaveValue('openrouter/auto')

  expect(await page.locator('body').innerText()).not.toContain(secret)
  expect(consoleMessages.join('\n')).not.toContain(secret)
  await page.screenshot({ path: 'test-results/ai-settings-1280x800.png' })

  await drawer.getByRole('button', { name: 'Close settings' }).click()
  await expect(drawer).toHaveCount(0)
  await expect(page.getByTestId('ai-status')).toContainText('AI breakdown via OpenRouter')

  await page.getByTestId('settings-toggle').click()
  const reopened = page.getByTestId('ai-settings')
  await expect(reopened.getByLabel('Provider')).toHaveValue('openrouter')
  await expect(reopened.getByLabel('Model')).toHaveValue('openrouter/auto')
  await expect(reopened.getByLabel('API key')).toHaveValue('')
  await expect(reopened.getByLabel('API key')).toHaveAttribute('placeholder', /Key saved/)

  await reopened.getByLabel('Provider').selectOption('opencode')
  await expect(reopened.getByLabel('Proxy base URL')).toBeVisible()
  await expect(reopened.getByLabel('API key')).toHaveAttribute(
    'placeholder',
    'OpenCode Console API key',
  )

  await reopened.getByLabel('Provider').selectOption('openrouter')
  await reopened.getByRole('button', { name: 'Remove key' }).click()
  await expect(reopened).toContainText('Key removed')
  await expect(reopened.getByRole('button', { name: 'Remove key' })).toBeDisabled()

  await reopened.getByRole('button', { name: 'Close settings' }).click()
  await expect(page.getByTestId('ai-status')).toContainText('Sample mode')

  expect(consoleErrors).toEqual([])
})

test('settings tabs support arrow keys and return focus', async ({ page }) => {
  await page.goto('/')

  const toggle = page.getByTestId('settings-toggle')
  await expect(toggle).toHaveAttribute('aria-haspopup', 'dialog')
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')

  await toggle.focus()
  await toggle.press('Enter')
  await expect(toggle).toHaveAttribute('aria-expanded', 'true')

  const drawer = page.getByTestId('ai-settings')
  const aiTab = page.getByTestId('settings-tab-ai')
  const dataTab = page.getByTestId('settings-tab-data')

  await aiTab.focus()
  await aiTab.press('ArrowRight')
  await expect(dataTab).toHaveAttribute('aria-selected', 'true')
  await expect(dataTab).toBeFocused()
  await expect(page.getByTestId('data-panel')).toBeVisible()

  await dataTab.press('ArrowLeft')
  await expect(aiTab).toHaveAttribute('aria-selected', 'true')
  await expect(aiTab).toBeFocused()

  await page.keyboard.press('Escape')
  await expect(drawer).toHaveCount(0)
  await expect(toggle).toBeFocused()
})

test('the workspace has a page heading and the skip link focuses main', async ({ page }) => {
  await page.goto('/')

  const skip = page.getByRole('link', { name: 'Skip to main content' })
  await skip.focus()
  await skip.press('Enter')
  await expect(page.locator('#main-content')).toBeFocused()

  await page.getByTestId('sample-card').click()
  await expect(page.getByRole('heading', { level: 1, name: 'Reading workspace' })).toHaveCount(1)
})

test('AI settings do not alter the workspace sidebar when closed with Escape', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('sample-card').click()
  await expectSidebarState(page, true)

  await page.getByTestId('settings-toggle').click()
  await expect(page.getByTestId('ai-settings')).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(page.getByTestId('ai-settings')).toHaveCount(0)
  await expectSidebarState(page, true)
})

test('AI breakdown shows loading then opens a generated session', async ({ page }) => {
  const consoleErrors = collectPageErrors(page)
  const secret = 'sk-or-v1-generation-secret'
  let authorization = ''
  let model = ''

  await primeAiSettings(page, {
    ...OPENROUTER_SETTINGS,
    keys: { openrouter: secret },
  })
  await mockOpenRouter(page, {
    body: OPENAI_COMPLETION,
    delayMs: 500,
    onRequest: (request) => {
      authorization = request.headers()['authorization'] ?? ''
      const body = request.postDataJSON() as { model?: string }
      model = body.model ?? ''
    },
  })

  await page.goto('/')
  await expect(page.getByTestId('ai-status')).toContainText('AI breakdown via OpenRouter')

  const input = page.getByRole('textbox', { name: 'Japanese sentence' })
  await input.fill('猫が好きです。')
  await input.press('Enter')

  await expect(page.getByTestId('ai-loading')).toBeVisible()
  await expect(page.getByTestId('workspace-view')).toBeVisible({ timeout: 5_000 })
  await expect(page.locator('[data-chunk]')).toHaveCount(2)
  await expect(page.locator('[data-chunk="1"]')).toHaveAttribute('aria-label', '猫が')
  await expect(page.locator('[data-chunk="2"]')).toHaveAttribute('aria-label', '好きです。')
  await expect(page.getByTestId('breakdown-sidebar')).toContainText('Chunk 01')
  await expect(page.getByTestId('toast')).toContainText('AI breakdown saved to history')
  await expect(page.getByRole('button', { name: 'Saved' })).toBeDisabled()
  await expect(page.locator('[data-history-id]')).toHaveCount(4)

  const generatedItem = page.locator('.history-item').filter({ hasText: '猫が好きです' })
  await expect(generatedItem).toHaveCount(1)

  await page.getByRole('button', { name: 'Bunkai home' }).click()
  await expect(page.getByTestId('home-view')).toBeVisible()
  await generatedItem.click()
  await expect(page.getByTestId('workspace-view')).toBeVisible()
  await expect(page.locator('[data-chunk="1"]')).toHaveAttribute('aria-label', '猫が')
  await expect(page.locator('[data-chunk="2"]')).toHaveAttribute('aria-label', '好きです。')

  await page.reload()
  await expect(page.getByTestId('workspace-view')).toBeVisible()
  await expect(page.locator('[data-chunk="1"]')).toHaveAttribute('aria-label', '猫が')
  await expect(page.locator('[data-chunk="2"]')).toHaveAttribute('aria-label', '好きです。')
  await expect(page.locator('[data-history-id]')).toHaveCount(4)
  await expect(page.locator('.history-item.is-active')).toContainText('猫が好きです')

  expect(authorization).toBe(`Bearer ${secret}`)
  expect(model).toBe('openrouter/auto')
  expect(await page.locator('body').innerText()).not.toContain(secret)

  await settleMotion(page)
  await page.screenshot({ path: 'test-results/ai-breakdown-1280x800.png' })

  expect(consoleErrors).toEqual([])
})

test('rejects an AI breakdown with non-Japanese chunks', async ({ page }) => {
  const badBreakdown = {
    ...AI_BREAKDOWN,
    chunks: [{ ...AI_BREAKDOWN.chunks[0], jp: 'cats', kana: '' }, AI_BREAKDOWN.chunks[1]],
  }
  const completion = {
    choices: [
      {
        message: {
          role: 'assistant',
          content: JSON.stringify(badBreakdown),
        },
      },
    ],
  }

  await primeAiSettings(page, OPENROUTER_SETTINGS)
  await mockOpenRouter(page, { body: completion })
  await page.goto('/')

  const input = page.getByRole('textbox', { name: 'Japanese sentence' })
  await input.fill('猫が好きです。')
  await input.press('Enter')

  await expect(page.getByTestId('toast')).toContainText('not Japanese')
  await expect(page.getByTestId('ai-error')).toContainText('not Japanese')
  await expect(page.getByTestId('workspace-view')).toHaveCount(0)
  await expect(page.locator('[data-history-id]')).toHaveCount(3)
  await expect(input).toHaveValue('猫が好きです。')
})

test('an older AI session can add colors and furigana without regenerating', async ({ page }) => {
  const consoleErrors = collectPageErrors(page)
  let calls = 0

  const oldBreakdown = {
    ...AI_BREAKDOWN,
    naturalParts: undefined,
    chunks: AI_BREAKDOWN.chunks.map((chunk) => ({
      jp: chunk.jp,
      kana: chunk.kana,
      gloss: chunk.gloss,
      role: chunk.role,
      color: chunk.color,
      note: chunk.note,
      construction: chunk.construction,
      examples: chunk.examples,
    })),
  }

  await primeAiSettings(page, OPENROUTER_SETTINGS)
  await page.route('https://openrouter.ai/**', async (route) => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: CORS_HEADERS })
      return
    }

    calls += 1
    const payload =
      calls === 1
        ? oldBreakdown
        : {
            naturalParts: AI_BREAKDOWN.naturalParts,
            chunks: AI_BREAKDOWN.chunks.map((chunk, index) => ({
              n: index + 1,
              furigana: chunk.furigana,
            })),
          }

    await route.fulfill({
      status: 200,
      headers: { ...CORS_HEADERS, 'content-type': 'application/json' },
      body: JSON.stringify({
        choices: [{ message: { role: 'assistant', content: JSON.stringify(payload) } }],
      }),
    })
  })

  await page.goto('/')
  const input = page.getByRole('textbox', { name: 'Japanese sentence' })
  await input.fill('猫が好きです。')
  await input.press('Enter')
  await expect(page.getByTestId('workspace-view')).toBeVisible()
  await expect(page.locator('.sentence rt')).toHaveCount(0)

  await page.getByRole('button', { name: 'Natural' }).click()
  const translation = page.getByTestId('translation-text')
  await expect(translation).toContainText('I like cats.')
  await expect(translation.locator('.chunk')).toHaveCount(0)

  const enrichButton = page.getByRole('button', { name: 'Add colors & readings' })
  await expect(enrichButton).toBeVisible()
  await page.screenshot({ path: 'test-results/ai-old-session-1280x800.png' })
  await enrichButton.click()

  await expect(page.getByTestId('toast')).toContainText('Session colors and readings mapped')
  await expect(translation.locator('.chunk.c2')).toHaveText('like')
  await expect(translation.locator('.chunk.c1')).toHaveText('cats.')
  await expect(page.locator('[data-chunk="1"] rt')).toHaveText('ねこ')
  await expect(page.locator('[data-chunk="2"] rt')).toHaveText('す')
  await expect(enrichButton).toHaveCount(0)
  expect(calls).toBe(2)

  await settleMotion(page)
  await page.screenshot({ path: 'test-results/ai-enriched-1280x800.png' })

  await page.reload()
  await expect(page.getByTestId('workspace-view')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Natural' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(page.getByTestId('translation-text').locator('.chunk.c1')).toHaveText('cats.')
  await expect(page.locator('[data-chunk="1"] rt')).toHaveText('ねこ')
  await expect(page.getByRole('button', { name: 'Add colors & readings' })).toHaveCount(0)

  expect(consoleErrors).toEqual([])
})

test('OpenCode uses the supplied OpenAI-compatible proxy endpoint', async ({ page }) => {
  const consoleErrors = collectPageErrors(page)
  let authorization = ''
  let model = ''

  await primeAiSettings(page, OPENCODE_SETTINGS)
  await mockOpenCodeProxy(page, {
    body: OPENAI_COMPLETION,
    onRequest: (request) => {
      authorization = request.headers()['authorization'] ?? ''
      const body = request.postDataJSON() as { model?: string }
      model = body.model ?? ''
    },
  })

  await page.goto('/')
  await expect(page.getByTestId('ai-status')).toContainText('OpenCode')

  const input = page.getByRole('textbox', { name: 'Japanese sentence' })
  await input.fill('猫が好きです。')
  await input.press('Enter')

  await expect(page.getByTestId('workspace-view')).toBeVisible()
  await expect(page.locator('[data-chunk]')).toHaveCount(2)
  expect(authorization).toBe('Bearer opencode-e2e-secret')
  expect(model).toBe('deepseek-v4.1-flash')

  expect(consoleErrors).toEqual([])
})

test('invalid AI keys show an inline error and a manual fallback', async ({ page }) => {
  const consoleErrors = collectPageErrors(page)
  const secret = 'sk-or-v1-invalid-secret'

  await primeAiSettings(page, {
    ...OPENROUTER_SETTINGS,
    keys: { openrouter: secret },
  })
  await mockOpenRouter(page, { status: 401, body: { error: { message: 'bad key' } } })

  await page.goto('/')
  const input = page.getByRole('textbox', { name: 'Japanese sentence' })
  await input.fill('犬が好きです。')
  await input.press('Enter')

  const error = page.getByTestId('ai-error')
  await expect(error).toBeVisible()
  await expect(error).toContainText('API key was rejected')
  await expect(page.getByTestId('workspace-view')).toHaveCount(0)
  await expect(page.getByTestId('sample-card')).toBeVisible()
  expect(await page.locator('body').innerText()).not.toContain(secret)

  await page.getByRole('button', { name: 'Open manual placeholder' }).click()
  await expect(page.getByTestId('workspace-view')).toBeVisible()
  await expect(page.locator('[data-chunk]')).toHaveCount(1)

  expect(consoleErrors.filter((error) => !error.includes('Failed to load resource'))).toEqual([])
})

test('rate-limit errors are explained inline', async ({ page }) => {
  await primeAiSettings(page, OPENROUTER_SETTINGS)
  await mockOpenRouter(page, { status: 429, body: { error: { message: 'slow down' } } })

  await page.goto('/')
  const input = page.getByRole('textbox', { name: 'Japanese sentence' })
  await input.fill('鳥が好きです。')
  await input.press('Enter')

  await expect(page.getByTestId('ai-error')).toContainText('rate-limiting requests')
  await expect(page.getByTestId('workspace-view')).toHaveCount(0)
})

test('AI settings render in dark mode', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Switch to dark theme' }).click()
  await page.getByTestId('settings-toggle').click()

  const drawer = page.getByTestId('ai-settings')
  await expect(drawer).toBeVisible()
  await expect(drawer).toHaveCSS('opacity', '1')
  await expect(page.getByRole('button', { name: 'Close settings' }).first()).toBeVisible()

  const styles = await page.evaluate(() => {
    const panel = document.querySelector<HTMLElement>('[data-testid="ai-settings"]')
    const scrim = document.querySelector<HTMLElement>('.settings-scrim')
    return {
      panel: panel ? getComputedStyle(panel).backgroundColor : '',
      scrim: scrim ? getComputedStyle(scrim).backgroundColor : '',
    }
  })

  expect(styles.panel).toBe('rgb(38, 34, 29)')
  expect(styles.scrim).toBe('rgba(0, 0, 0, 0.55)')

  await page.screenshot({ path: 'test-results/ai-settings-1280x800-dark.png' })
})

test('theme persists after reload', async ({ page }) => {
  const consoleErrors = collectPageErrors(page)

  await page.goto('/')
  await page.getByRole('button', { name: 'Switch to dark theme' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect.poll(() => page.evaluate(() => localStorage.getItem('bunkai.theme'))).toBe('dark')

  await page.screenshot({ path: 'test-results/home-1280x800-dark.png' })
  await page.reload()

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect(page.getByTestId('home-view')).toBeVisible()
  expect(consoleErrors).toEqual([])
})
