import { test as base, expect } from '@playwright/test'
import { createOrderLookupActions } from './actions/orderLookupActions'
import { createConfiguratorActions } from './actions/configuratorActions'
import { createCheckoutActions } from './actions/checkoutActions'
import { createSuccessActions } from './actions/successActions'
import { mockCreditAnalysis } from './mock.api'
import { createHeroActions } from './actions/heroActions'
import { ArrowUpSquare } from 'lucide-react'

export type App = {
  orderLookup: ReturnType<typeof createOrderLookupActions>
  configurator: ReturnType<typeof createConfiguratorActions>
  checkout: ReturnType<typeof createCheckoutActions>
  success: ReturnType<typeof createSuccessActions>
  hero: ReturnType<typeof createHeroActions>
  mock: {
    creditAnalysis: (score: number) => Promise<void>
  }
}

export const test = base.extend<{ app: App }>({
  app: async ({ page }, use) => {
    await use({
      orderLookup: createOrderLookupActions(page),
      configurator: createConfiguratorActions(page),
      checkout: createCheckoutActions(page),
      success: createSuccessActions(page),
      hero: createHeroActions(page),
      mock: {
        creditAnalysis: async (score: number) => await mockCreditAnalysis(page, score),
      }
    })

  },
})

export { expect }
