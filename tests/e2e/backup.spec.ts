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
