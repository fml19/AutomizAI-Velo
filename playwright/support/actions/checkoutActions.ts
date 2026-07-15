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
      await page.getByTestId('checkout-email').fill(customer.email)
      await page.getByTestId('checkout-phone').fill(customer.phone)
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

    async fillDownPayment(value: string) {
      await page.getByTestId('input-entry-value').fill(value)
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

    async submitPayment(
      paymentMethod: string,
      options: { downPayment?: string; expectedTotal?: string } = {}
    ) {
      await this.selectPaymentMethod(paymentMethod)

      if (options.downPayment) {
        await this.fillDownPayment(options.downPayment)
      }

      if (options.expectedTotal) {
        await this.expectSummaryTotal(options.expectedTotal)
      }

      await this.acceptTerms()
      await this.submit()
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

    async expectResult(status: string) {
      await expect(page).toHaveURL(/\/success$/)
      await expect(page.getByRole('heading', { name: status })).toBeVisible()
    },
  }
}
