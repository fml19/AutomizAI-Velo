import { expect, Page } from '@playwright/test'

type CustomerData = {
  name: string
  surname: string
  email: string
  phone: string
  cpf: string
}

export function createCheckoutActions(page: Page) {
  return {
    async expectLoaded() {
      await expect(page).toHaveURL(/\/order$/)
      await expect(page.getByRole('heading', { name: 'Finalizar Pedido' })).toBeVisible()
    },

    async expectSummaryTotal(total: string) {
      await expect(page.getByTestId('summary-total-price')).toHaveText(total)
    },

    async fillCustomerData(customer: CustomerData) {
      await page.getByTestId('checkout-name').fill(customer.name)
      await page.getByTestId('checkout-surname').fill(customer.surname)
      await page.getByLabel('Email').fill(customer.email)
      await page.getByLabel('Telefone').fill(customer.phone)
      await page.getByLabel('CPF').fill(customer.cpf)
    },

    async selectStore(name: string) {
      await page.getByTestId('checkout-store').click()
      await page.getByRole('option', { name }).click()
    },

    async acceptTerms() {
      await page.getByTestId('checkout-terms').click()
    },

    async submit() {
      await page.getByRole('button', { name: 'Confirmar Pedido' }).click()
    },

    async createCashOrder(total: string, customer: CustomerData, store: string) {
      await this.expectLoaded()
      await this.expectSummaryTotal(total)
      await this.fillCustomerData(customer)
      await this.selectStore(store)
      await this.acceptTerms()
      await this.submit()
    },
  }
}
