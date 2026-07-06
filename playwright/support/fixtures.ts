import { test as base, expect } from '@playwright/test'
import { createOrderLookupActions } from './actions/orderLookupActions'
import { createConfiguratorActions } from './actions/configuratorActions'
import { createCheckoutActions } from './actions/checkoutActions'
import { createSuccessActions } from './actions/successActions'

export type App = {
  orderLookup: ReturnType<typeof createOrderLookupActions>
  configurator: ReturnType<typeof createConfiguratorActions>
  checkout: ReturnType<typeof createCheckoutActions>
  success: ReturnType<typeof createSuccessActions>
}

export const test = base.extend<{ app: App }>({
  app: async ({ page }, use) => {
    await use({
      orderLookup: createOrderLookupActions(page),
      configurator: createConfiguratorActions(page),
      checkout: createCheckoutActions(page),
      success: createSuccessActions(page),
    })
  },
})

export { expect }
