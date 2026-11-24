import { expect, test } from './fixtures'

test('history menu deletes and restores the active query', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('sample-card').click()
  await expect(page.getByTestId('workspace-view')).toBeVisible()

  const trigger = page.locator('[data-history-menu="sample"]')
  await expect(trigger.locator('.history-strip i')).toHaveCount(3)
  await trigger.click()

  const menu = page.getByTestId('history-menu')
  await expect(menu).toBeVisible()
  await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  await expect(menu.getByRole('menuitem', { name: 'Delete query' })).toBeFocused()
  await page.screenshot({ path: 'test-results/history-menu-1280x800.png' })

  await page.keyboard.press('Escape')
  await expect(menu).toHaveCount(0)
  await expect(trigger).toBeFocused()

  await trigger.click()
  await page.getByRole('menuitem', { name: 'Delete query' }).click()
  await expect(page.locator('[data-history-id="sample"]')).toHaveCount(0)
  await expect(page.getByTestId('toast')).toContainText('Query deleted')
  await expect(page.getByTestId('workspace-view')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Save' })).toBeEnabled()

  await page.getByTestId('toast').getByRole('button', { name: 'Undo' }).click()
  await expect(page.locator('[data-history-id="sample"]')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Saved' })).toBeDisabled()
})

test('history query deletion persists after reload', async ({ page }) => {
  await page.goto('/')
  await page.locator('[data-history-menu="s-b"]').click()
  await page.getByRole('menuitem', { name: 'Delete query' }).click()

  await expect(page.locator('[data-history-id="s-b"]')).toHaveCount(0)
  await expect(page.getByTestId('toast')).toContainText('Query deleted')

  await page.reload()
  await expect(page.locator('[data-history-id="s-b"]')).toHaveCount(0)
  await expect(page.locator('[data-history-id]')).toHaveCount(2)
})
