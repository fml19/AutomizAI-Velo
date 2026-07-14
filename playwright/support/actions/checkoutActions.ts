import { expect, Page } from '@playwright/test'

export type CustomerData = {
  name: string
  lastname: string
  email: string
  phone: string
  document: string
}

export function createCheckoutActions(page: Page) {

  const terms = page.getByTestId('checkout-terms')
  const alerts = {

    name: page.getByTestId('error-name'),
    lastname: page.getByTestId('error-lastname'),
    email: page.getByTestId('error-email'),
    phone: page.getByTestId('error-phone'),
    document: page.getByTestId('error-document'),
    store: page.getByTestId('error-store'),
    terms: page.getByTestId('error-terms')
  }

  return {

    elements: {
      terms,
      alerts
    },

    async expectLoaded() {
      await expect(page).toHaveURL(/\/order$/)
      await expect(page.getByRole('heading', { name: 'Finalizar Pedido' })).toBeVisible()
    },

    async expectSummaryTotal(total: string) {
      await expect(page.getByTestId('summary-total-price')).toHaveText(total)
    },

    async fillCustomerData(customer: CustomerData) {
      await page.getByTestId('checkout-name').fill(customer.name)
      await page.getByTestId('checkout-lastname').fill(customer.lastname)
      await page.getByLabel('Email').fill(customer.email)
      await page.getByLabel('Telefone').fill(customer.phone)
      await page.getByTestId('checkout-document').fill(customer.document)
    },

    async selectStore(name: string) {
      await page.getByTestId('checkout-store').click()
      await page.getByRole('option', { name }).click()
    },

    async acceptTerms() {
      await terms.check()
    },

    async selectPaymentMethod(paymentMethod: string) {
      const paymentButton = page.getByRole('button', { name: new RegExp(paymentMethod, 'i') })
      await expect(paymentButton).toBeVisible()
      await paymentButton.click()
    },

    async selectCashPayment(total: string) {
      const cashPayment = page.getByRole('button', { name: /À Vista/ })
      await expect(cashPayment).toBeVisible()
      await expect(cashPayment).toContainText(total)
      await cashPayment.click()
      await this.expectSummaryTotal(total)
    },

    async submit() {
      await page.getByRole('button', { name: 'Confirmar Pedido' }).click()
    },

    async expectSubmitting() {
      const submittingButton = page.getByRole('button', { name: 'Processando...' })
      await expect(submittingButton).toBeVisible()
      await expect(submittingButton).toBeDisabled()
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
