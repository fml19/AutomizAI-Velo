import { Page, expect } from '@playwright/test'

export function createConfiguratorActions(page: Page) {
  const optionalCheckbox = (name: string | RegExp) => page.getByRole('checkbox', { name })
  return {
    async resetState() {
      await page.goto('/')
      await page.evaluate(() => localStorage.removeItem('velo-configurator-storage'))
      await page.reload()
    },

    async open() {
      await page.goto('/configure')
    },

    async openFromLanding() {
      await expect(page.getByTestId('hero-section')).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Velô Sprint', level: 1 })).toBeVisible()
      await page.getByRole('link', { name: /Configure Agora/ }).click()
      await expect(page).toHaveURL(/\/configure$/)
    },

    async selectColor(name: string) {
      await page.getByRole('button', { name }).click()
    },

    async selectWheels(name: string | RegExp) {
      await page.getByRole('button', { name }).click()
    },

    async selectOptional(name: string | RegExp) {
      await page.getByRole('checkbox', { name }).click()
    },

    async expectPrice(price: string) {
      const priceElement = page.getByTestId('total-price')
      await expect(priceElement).toBeVisible()
      await expect(priceElement).toHaveText(price)
    },

    async expectCarImageSrc(src: string) {
      const carImage = page.locator('img[alt^="Velô Sprint"]')
      await expect(carImage).toHaveAttribute('src', src)
    },

    async submitOrder() {
      await page.getByRole('button', { name: 'Monte o Seu' }).click()
    },

    async checkOptional(name: string | RegExp) {
      await expect(optionalCheckbox(name)).toBeVisible()
      await optionalCheckbox(name).check()
    },

    async uncheckOptional(name: string | RegExp) {
      await expect(optionalCheckbox(name)).toBeVisible()
      await optionalCheckbox(name).uncheck()
    },

    async finishConfigurator() {
      await page.getByRole('button', { name: 'Monte o seu' }).click()
    }
  }
}
