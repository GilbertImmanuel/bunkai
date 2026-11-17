import { test as base } from '@playwright/test'
import { mockTatoebaEmpty } from './tatoeba-fixtures'

/**
 * All e2e tests intercept Tatoeba with an empty response by default. Tests that
 * need examples call `mockTatoeba` to replace the default route. No automated
 * test is allowed to reach the live Tatoeba API.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await mockTatoebaEmpty(page)
    await use(page)
  },
})

export { expect } from '@playwright/test'
