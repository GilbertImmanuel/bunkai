import { expect, test } from '@playwright/test'

test('installs a manifest and serves the shell offline', async ({ page, context }) => {
  const cspErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error' && /content security policy/i.test(message.text())) {
      cspErrors.push(message.text())
    }
  })

  await page.goto('/')
  await expect(page.getByTestId('home-view')).toBeVisible()

  const csp = await page
    .locator('meta[http-equiv="Content-Security-Policy"]')
    .getAttribute('content')
  expect(csp).toContain("script-src 'self'")
  expect(csp).toContain('https://*.tatoeba.org')
  expect(csp).toContain('http://127.0.0.1:*')
  expect(csp).toContain("object-src 'none'")

  await expect(page.locator('meta[name="referrer"]')).toHaveAttribute('content', 'no-referrer')

  const manifestLink = page.locator('link[rel="manifest"]')
  await expect(manifestLink).toHaveAttribute('href', '/manifest.webmanifest')

  const manifest = await page.evaluate(async () => {
    const response = await fetch('/manifest.webmanifest')
    return (await response.json()) as {
      name?: string
      display?: string
      icons?: unknown[]
    }
  })

  expect(manifest.name).toContain('Bunkai')
  expect(manifest.display).toBe('standalone')
  expect(manifest.icons?.length).toBeGreaterThanOrEqual(3)

  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await page.reload()
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller))

  await context.setOffline(true)
  await page.reload({ waitUntil: 'domcontentloaded' })

  await expect(page.getByTestId('home-view')).toBeVisible()
  await page.getByTestId('sample-card').click()
  await expect(page.getByTestId('workspace-view')).toBeVisible()
  await expect(page.locator('[data-chunk]')).toHaveCount(6)
  expect(cspErrors).toEqual([])

  await context.setOffline(false)
})

test('exports a backup under the production CSP', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('home-view')).toBeVisible()

  await page.getByTestId('settings-toggle').click()
  await page.getByTestId('settings-tab-data').click()

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByTestId('data-export').click(),
  ])

  expect(download.suggestedFilename()).toMatch(/^bunkai-sessions-\d{4}-\d{2}-\d{2}\.json$/)
})
