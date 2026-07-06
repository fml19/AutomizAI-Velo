import { expect, Page } from '@playwright/test'

export function createSuccessActions(page: Page) {
  return {
    async expectApprovedOrder() {
      await expect(page).toHaveURL(/\/success$/)
      await expect(page.getByTestId('success-status')).toHaveText('Pedido Aprovado!')
    },

    async expectOrderNumberVisible() {
      const orderNumber = (await page.getByTestId('order-id').innerText()).trim()
      await expect(page.getByText(orderNumber)).toBeVisible()
      return orderNumber
    },

    async expectTotal(total: string) {
      await expect(page.getByText(total)).toBeVisible()
    },

    async expectApprovedOrderWithTotal(total: string) {
      await this.expectApprovedOrder()
      await this.expectOrderNumberVisible()
      await this.expectTotal(total)
    },
  }
}
