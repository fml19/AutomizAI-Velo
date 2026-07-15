import { expect, Page } from '@playwright/test'
import type { CustomerData } from './checkoutActions'

export function createSuccessActions(page: Page) {
  return {
    async expectOrderStatus(status: string) {
      await expect(page).toHaveURL(/\/success$/)
      await expect(page.getByTestId('success-status')).toHaveText(status)
    },

    async expectApprovedOrder() {
      await this.expectOrderStatus('Pedido Aprovado!')
    },

    async expectOrderNumberVisible() {
      const orderNumber = (await page.getByTestId('order-id').innerText()).trim()
      await expect(page.getByText(orderNumber)).toBeVisible()
      return orderNumber
    },

    async expectTotal(total: string) {
      await expect(page.getByText(total)).toBeVisible()
    },

    async expectCustomer(customer: CustomerData, store: string) {
      await expect(page.getByText(`${customer.name} ${customer.lastname}`, { exact: true })).toBeVisible()
      await expect(page.getByText(customer.email, { exact: true })).toBeVisible()
      await expect(page.getByText(store, { exact: true })).toBeVisible()
    },

    async expectApprovedOrderWithTotal(total: string) {
      await this.expectApprovedOrder()
      await this.expectOrderNumberVisible()
      await this.expectTotal(total)
    },
  }
}
