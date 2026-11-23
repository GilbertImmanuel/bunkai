import { expect, test } from '@playwright/test'

test('installs a manifest and serves the shell offline', async ({ page, context }) => {
  await page.goto('/')
  await expect(page.getByTestId('home-view')).toBeVisible()

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

  await context.setOffline(false)
})
