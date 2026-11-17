import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'
import { EMPTY_TATOEBA, TATOEBA_RESPONSE, mockTatoeba } from './tatoeba-fixtures'

function collectPageErrors(page: Page): string[] {
  const errors: string[] = []

  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => {
    errors.push(error.message)
  })

  return errors
}

async function openSample(page: Page): Promise<void> {
  await page.goto('/')
  await page.getByTestId('sample-card').click()
  await expect(page.getByTestId('workspace-view')).toBeVisible()
  await expect(page.getByTestId('sidebar-panel')).toContainText('Chunk 05')
}

test('Tatoeba examples render under the selected chunk', async ({ page }) => {
  const consoleErrors = collectPageErrors(page)
  const requests: string[] = []

  await mockTatoeba(page, {
    body: TATOEBA_RESPONSE,
    onRequest: (request) => requests.push(request.url()),
  })
  await openSample(page)

  const section = page.getByTestId('tatoeba-section')

  await expect(section).toBeVisible()
  await expect(page.getByTestId('tatoeba-example')).toHaveCount(3)
  await expect(section).toContainText('From Tatoeba')
  await expect(section).toContainText('共有したい？')
  await expect(section).toContainText('Do you want to share it?')
  await expect(section).toContainText('彼は部屋を共有している。')
  await expect(section).toContainText('He shares a room.')

  await expect(page.getByTestId('tatoeba-source').first()).toHaveAttribute(
    'href',
    'https://tatoeba.org/en/sentences/show/10386401',
  )
  await expect(page.getByTestId('tatoeba-search-link')).toHaveAttribute(
    'href',
    /tatoeba\.org\/en\/sentences\/search\?query=%E5%85%B1%E6%9C%89/,
  )
  await expect(page.getByTestId('tatoeba-attribution')).toContainText('CC BY 2.0 FR')
  await expect(page.getByTestId('generated-examples')).toHaveCount(0)

  expect(requests.some((url) => url.includes('q=%E5%85%B1%E6%9C%89'))).toBe(true)

  const searchRequest = requests.find((url) => url.includes('q=%E5%85%B1%E6%9C%89'))
  expect(searchRequest).toBeTruthy()
  const searchUrl = new URL(searchRequest ?? '')
  expect(searchUrl.searchParams.get('limit')).toBe('10')
  expect(searchUrl.searchParams.get('sort')).toBe('relevance')
  expect(searchUrl.searchParams.get('trans:lang')).toBe('eng')
  expect(searchUrl.searchParams.get('showtrans:lang')).toBe('eng')
  expect(searchUrl.searchParams.get('include')).toBe('audios')

  const overflow = await page.evaluate(() => {
    const body = document.querySelector<HTMLElement>('[data-testid="sidebar-body"]')
    return {
      page: document.documentElement.scrollWidth > window.innerWidth,
      sidebar: body ? body.scrollWidth > body.clientWidth : false,
    }
  })
  expect(overflow).toEqual({ page: false, sidebar: false })

  await section.scrollIntoViewIfNeeded()
  await page.screenshot({ path: 'test-results/tatoeba-sidebar-1280x800.png' })

  expect(consoleErrors).toEqual([])
})

test('the audio button appears only for licensed audio', async ({ page }) => {
  await mockTatoeba(page, { body: TATOEBA_RESPONSE })
  await openSample(page)

  const section = page.getByTestId('tatoeba-section')

  await expect(page.getByTestId('tatoeba-example')).toHaveCount(3)
  await expect(page.getByTestId('tatoeba-audio')).toHaveCount(1)
  await expect(page.getByTestId('tatoeba-audio')).toHaveAttribute(
    'aria-label',
    'Play audio for Tatoeba sentence 10386401',
  )
  await expect(section).toContainText('Audio: CK · CC BY-NC-ND 3.0')
  await expect(section).not.toContainText('someone')
})

test('Tatoeba shows an inline loading state', async ({ page }) => {
  await mockTatoeba(page, { body: TATOEBA_RESPONSE, delayMs: 800 })
  await openSample(page)

  await expect(page.getByTestId('tatoeba-loading')).toBeVisible()
  await expect(page.getByTestId('tatoeba-loading')).toContainText('Searching Tatoeba')
  await expect(page.getByTestId('tatoeba-example')).toHaveCount(3)
})

test('Tatoeba errors fall back to generated examples', async ({ page }) => {
  await mockTatoeba(page, { status: 500 })
  await openSample(page)

  await expect(page.getByTestId('tatoeba-error')).toContainText('Tatoeba is unavailable')
  await expect(page.getByTestId('tatoeba-retry')).toBeVisible()
  await expect(page.getByTestId('generated-examples')).toBeVisible()
  await expect(page.getByTestId('examples').locator('.example')).toHaveCount(3)
})

test('Tatoeba retry recovers from an error', async ({ page }) => {
  await mockTatoeba(page, { status: 500 })
  await openSample(page)

  await expect(page.getByTestId('tatoeba-error')).toBeVisible()

  await mockTatoeba(page, { body: TATOEBA_RESPONSE })
  await page.getByTestId('tatoeba-retry').click()

  await expect(page.getByTestId('tatoeba-example')).toHaveCount(3)
  await expect(page.getByTestId('tatoeba-error')).toHaveCount(0)
})

test('Tatoeba empty results fall back to generated examples', async ({ page }) => {
  await mockTatoeba(page, { body: EMPTY_TATOEBA })
  await openSample(page)

  await expect(page.getByTestId('tatoeba-empty')).toContainText('No Tatoeba examples found')
  await expect(page.getByTestId('generated-examples')).toBeVisible()
  await expect(page.getByTestId('examples').locator('.example')).toHaveCount(3)
})

test('cached Tatoeba results avoid a second request', async ({ page }) => {
  const requests: string[] = []

  await mockTatoeba(page, {
    body: TATOEBA_RESPONSE,
    onRequest: (request) => requests.push(request.url()),
  })
  await openSample(page)

  await expect(page.getByTestId('tatoeba-example')).toHaveCount(3)

  await page.locator('[data-chunk="4"]').click()
  await expect(page.getByTestId('sidebar-panel')).toContainText('誰かと')
  await expect(page.getByTestId('tatoeba-empty')).toContainText('誰か')

  await page.locator('[data-chunk="5"]').click()
  await expect(page.getByTestId('sidebar-panel')).toContainText('共有したくなった')
  await expect(page.getByTestId('tatoeba-example')).toHaveCount(3)
  await expect(page.getByTestId('tatoeba-cached')).toBeVisible()

  expect(requests.filter((url) => url.includes('q=%E5%85%B1%E6%9C%89'))).toHaveLength(1)

  await page.reload()
  await expect(page.getByTestId('workspace-view')).toBeVisible()
  await expect(page.getByTestId('tatoeba-example')).toHaveCount(3)
  await expect(page.getByTestId('tatoeba-cached')).toBeVisible()

  expect(requests.filter((url) => url.includes('q=%E5%85%B1%E6%9C%89'))).toHaveLength(1)
})

test('Tatoeba examples render in light and dark mode', async ({ page }) => {
  const consoleErrors = collectPageErrors(page)

  await mockTatoeba(page, { body: TATOEBA_RESPONSE })
  await openSample(page)
  await expect(page.getByTestId('tatoeba-example')).toHaveCount(3)

  const section = page.getByTestId('tatoeba-section')
  await section.scrollIntoViewIfNeeded()
  await page.screenshot({ path: 'test-results/tatoeba-sidebar-1280x800.png' })

  await page.getByRole('button', { name: 'Switch to dark theme' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.waitForTimeout(250)
  await page.screenshot({ path: 'test-results/tatoeba-sidebar-1280x800-dark.png' })

  expect(consoleErrors).toEqual([])
})

test('manual placeholder sessions do not search Tatoeba', async ({ page }) => {
  const requests: string[] = []

  await mockTatoeba(page, {
    body: EMPTY_TATOEBA,
    onRequest: (request) => requests.push(request.url()),
  })

  await page.goto('/')
  const input = page.getByRole('textbox', { name: 'Japanese sentence' })
  await input.fill('日本語を勉強しています。')
  await input.press('Enter')

  await expect(page.getByTestId('workspace-view')).toBeVisible()
  await expect(page.getByTestId('sidebar-panel')).toContainText('Chunk 01')
  await expect(page.getByTestId('tatoeba-section')).toHaveCount(0)
  expect(requests).toHaveLength(0)
})
