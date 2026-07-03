import { test as base, expect } from '@playwright/test'


import { createOrderLookupActions } from './actions/orderLookupActions'

type App = {
  orderLookup: ReturnType<typeof createOrderLookupActions>
}

export const test = base.extend<{ app: App }>({
  app: async ({ page }, use) => {
    await use({
      orderLookup: createOrderLookupActions(page),
    })
  },
})

export { expect }
