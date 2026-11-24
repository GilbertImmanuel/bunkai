import { readFileSync } from 'node:fs'
import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'

const importedSession = {
  id: 'imported-session',
  sentence: 'インポートした文です。',
  reading: 'いんぽーとしたぶんです',
  natural: 'This is an imported sentence.',
  raw: 'imported sentence',
  chunks: [
    {
      n: 1,
      jp: 'インポートした文です。',
      kana: 'いんぽーとしたぶんです',
      gloss: 'imported sentence',
      role: 'sentence',
      color: 1,
      note: 'Imported from a backup.',
      construction: [],
      examples: [],
    },
  ],
  sentenceNote: ['Imported session.'],
  createdAt: '2026-11-22T10:00:00.000Z',
  source: 'manual',
}

const nestedSession = {
  id: 'tree-nested',
  sentence: '利男は一番大事なところでよく勉強しなかったから何も分からなくなってしまった。',
  reading: '',
  natural: '',
  raw: '',
  chunks: [
    {
      n: 1,
      jp: '利男は',
      kana: '',
      gloss: '',
      role: 'topic',
      color: 3,
      note: '',
      construction: [],
      examples: [],
    },
    {
      n: 2,
      jp: '一番大事なところで',
      kana: '',
      gloss: '',
      role: 'location',
      color: 4,
      note: '',
      construction: [],
      examples: [],
    },
    {
      n: 3,
      jp: 'よく勉強しなかったから',
      kana: '',
      gloss: '',
      role: 'reason clause',
      color: 2,
      note: '',
      construction: [],
      examples: [],
    },
    {
      n: 4,
      jp: '何も分からなくなってしまった。',
      kana: '',
      gloss: '',
      role: 'main predicate',
      color: 1,
      note: '',
      construction: [],
      examples: [],
    },
  ],
  sentenceNote: [],
  createdAt: '2026-11-24T12:00:00.000Z',
  source: 'ai',
}

const overlapSession = {
  id: 'tree-overlap',
  sentence: 'どのテレビを買おうかと迷ったあげく、何も買わずに帰ってしまった。',
  reading: '',
  natural: '',
  raw: '',
  chunks: [
    {
      n: 1,
      jp: 'どのテレビを',
      kana: '',
      gloss: 'which TV (object)',
      role: 'object',
      color: 1,
      note: '',
      construction: [],
      examples: [],
    },
    {
      n: 2,
      jp: '買おうかと',
      kana: '',
      gloss: 'whether to buy',
      role: 'embedded question',
      color: 2,
      note: '',
      construction: [],
      examples: [],
    },
    {
      n: 3,
      jp: '迷ったあげく、',
      kana: '',
      gloss: 'after agonizing,',
      role: 'time clause',
      color: 3,
      note: '',
      construction: [],
      examples: [],
    },
    {
      n: 4,
      jp: '何も買わずに',
      kana: '',
      gloss: 'without buying anything',
      role: 'manner',
      color: 4,
      note: '',
      construction: [],
      examples: [],
    },
    {
      n: 5,
      jp: '帰ってしまった。',
      kana: '',
      gloss: 'ended up returning home.',
      role: 'main verb',
      color: 5,
      note: '',
      construction: [],
      examples: [],
    },
  ],
  sentenceNote: [],
  createdAt: '2026-11-24T13:00:00.000Z',
  source: 'ai',
}

function backup(sessions = [importedSession]) {
  return {
    version: 1,
    app: 'bunkai',
    exportedAt: '2026-11-22T12:00:00.000Z',
    sessions,
  }
}

async function openSettingsData(page: Page): Promise<void> {
  await page.goto('/')
  await expect(page.locator('[data-history-id="sample"]')).toBeVisible()
  await page.getByTestId('settings-toggle').click()
  await page.getByTestId('settings-tab-data').click()
  await expect(page.getByTestId('data-panel')).toBeVisible()
}

async function chooseBackup(page: Page, body: unknown, name = 'backup.json'): Promise<void> {
  await page.getByTestId('backup-file-input').setInputFiles({
    name,
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(body)),
  })
}

test('exports sessions without API keys', async ({ page }) => {
  await openSettingsData(page)
  await page.screenshot({ path: 'test-results/data-settings-1280x800.png' })

  await expect(page.getByTestId('data-panel')).toContainText('3 sessions')

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByTestId('data-export').click(),
  ])

  expect(download.suggestedFilename()).toMatch(/^bunkai-sessions-\d{4}-\d{2}-\d{2}\.json$/)

  const path = await download.path()
  expect(path).toBeTruthy()
  const text = readFileSync(path ?? '', 'utf8')
  const data = JSON.parse(text)

  expect(data.version).toBe(1)
  expect(data.app).toBe('bunkai')
  expect(data.sessions).toHaveLength(3)
  expect(JSON.stringify(data)).not.toContain('apiKey')
  expect(JSON.stringify(data)).not.toContain('bunkai.ai')
})

test('imports a backup with merge by default', async ({ page }) => {
  await openSettingsData(page)
  await chooseBackup(page, backup())

  await expect(page.getByTestId('data-import-preview')).toContainText('1 session')
  await expect(page.getByTestId('data-import-preview')).toContainText('exported')
  await page.screenshot({ path: 'test-results/data-import-1280x800.png' })

  await page.getByTestId('data-import-submit').click()

  await expect(page.getByTestId('toast')).toContainText('Imported 1 session')
  await expect(page.getByTestId('data-panel')).toHaveCount(0)
  await expect(page.locator('[data-history-id="imported-session"]')).toBeVisible()
  await expect(page.locator('[data-history-id="sample"]')).toBeVisible()

  await page.reload()
  await expect(page.locator('[data-history-id="imported-session"]')).toBeVisible()
  await expect(page.locator('[data-history-id="sample"]')).toBeVisible()
})

test('replaces history only after confirmation', async ({ page }) => {
  await openSettingsData(page)
  await chooseBackup(page, backup())

  await page.getByTestId('data-mode-replace').click()
  await expect(page.getByTestId('data-import-submit')).toBeDisabled()

  await page.getByTestId('data-replace-confirm').check()
  await expect(page.getByTestId('data-import-submit')).toBeEnabled()
  await page.getByTestId('data-import-submit').click()

  await expect(page.getByTestId('toast')).toContainText('Replaced history with 1 session')
  await expect(page.locator('[data-history-id="imported-session"]')).toBeVisible()
  await expect(page.locator('[data-history-id="sample"]')).toHaveCount(0)

  await page.reload()
  await expect(page.locator('[data-history-id="imported-session"]')).toBeVisible()
  await expect(page.locator('[data-history-id="sample"]')).toHaveCount(0)
})

test('import mode radios support arrow keys', async ({ page }) => {
  await openSettingsData(page)
  await chooseBackup(page, backup())

  const merge = page.getByTestId('data-mode-merge')
  const replace = page.getByTestId('data-mode-replace')

  await expect(merge).toHaveAttribute('tabindex', '0')
  await expect(replace).toHaveAttribute('tabindex', '-1')

  await merge.focus()
  await merge.press('ArrowRight')
  await expect(replace).toHaveAttribute('aria-checked', 'true')
  await expect(replace).toHaveAttribute('tabindex', '0')
  await expect(replace).toBeFocused()

  await replace.press('ArrowLeft')
  await expect(merge).toHaveAttribute('aria-checked', 'true')
  await expect(merge).toHaveAttribute('tabindex', '0')
  await expect(merge).toBeFocused()
})

test('rejects an invalid backup without changing history', async ({ page }) => {
  await openSettingsData(page)

  await page.getByTestId('backup-file-input').setInputFiles({
    name: 'broken.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{ not json'),
  })

  await expect(page.getByTestId('data-error')).toContainText('not valid JSON')
  await expect(page.locator('[data-history-id="sample"]')).toBeVisible()
})

test('skips duplicate session ids when merging', async ({ page }) => {
  await openSettingsData(page)
  await chooseBackup(
    page,
    backup([
      {
        ...importedSession,
        id: 'sample',
        sentence: '重複したセッションです。',
      },
    ]),
  )

  await page.getByTestId('data-import-submit').click()

  await expect(page.getByTestId('toast')).toContainText('No new sessions imported')
  await expect(page.locator('[data-history-id="sample"]')).toHaveCount(1)
})

test('renders imported nested modifiers as a branch tree', async ({ page }) => {
  await openSettingsData(page)
  await chooseBackup(page, backup([nestedSession]))
  await page.getByTestId('data-import-submit').click()

  await expect(page.getByTestId('toast')).toContainText('Imported 1 session')
  await page.locator('[data-history-id="tree-nested"]').click()
  await page.getByRole('button', { name: 'Tree' }).click()

  const modifiers = page.getByTestId('map-modifiers')
  await expect(modifiers).toContainText('Modifiers of B-engine')
  await expect(modifiers.locator('.map-modifier')).toHaveCount(2)
  await expect(modifiers.locator('.tree-children .map-modifier')).toHaveCount(1)
  await expect(modifiers.locator('.tree-children .map-modifier')).toContainText('Location')
  await expect(modifiers).not.toContainText('→ B-engine')
  await expect(page.locator('.tree-hint')).toContainText('Each branch modifies the node above it')
  await expect(page.locator('.tree-hint')).not.toContainText('·')

  await page.screenshot({ path: 'test-results/sentence-map-tree-nested-1280x800.png' })
})

test('nests embedded questions and wraps long literal-key roles', async ({ page }) => {
  await openSettingsData(page)
  await chooseBackup(page, backup([overlapSession]))
  await page.getByTestId('data-import-submit').click()

  await expect(page.getByTestId('toast')).toContainText('Imported 1 session')
  await page.locator('[data-history-id="tree-overlap"]').click()
  await page.getByRole('button', { name: 'Tree' }).click()

  const modifiers = page.getByTestId('map-modifiers')
  await expect(modifiers.locator('.map-modifier')).toHaveCount(4)
  await expect(modifiers.locator('.tree-list > .map-modifier')).toHaveCount(2)
  await expect(modifiers.locator('.tree-children .map-modifier')).toHaveCount(2)

  const nesting = await page.evaluate(() => {
    const embedded = [...document.querySelectorAll('.map-modifier')].find((element) =>
      element.textContent?.includes('Embedded question'),
    )
    const object = [...document.querySelectorAll('.map-modifier')].find((element) =>
      element.textContent?.includes('Object'),
    )

    return {
      embedded: Boolean(embedded),
      object: Boolean(object),
      objectInsideEmbedded: Boolean(embedded && object && embedded.contains(object)),
    }
  })
  expect(nesting).toEqual({ embedded: true, object: true, objectInsideEmbedded: true })
  await expect(page.locator('[data-testid="literal-key"]')).toContainText(/embedded question/i)

  const overflowingRoles = await page.locator('.key-role').evaluateAll((roles) =>
    roles
      .map((role) => ({
        text: role.textContent?.trim() ?? '',
        scrollWidth: role.scrollWidth,
        clientWidth: role.clientWidth,
      }))
      .filter((role) => role.scrollWidth > role.clientWidth + 1),
  )
  expect(overflowingRoles).toEqual([])

  await expect(page.getByTestId('toast')).toHaveCount(0, { timeout: 5_000 })
  await page.getByTestId('map-modifiers').screenshot({
    path: 'test-results/sentence-map-tree-overlap-1280x800.png',
  })
  await page.getByTestId('literal-key').screenshot({
    path: 'test-results/literal-key-overlap-1280x800.png',
  })
})
