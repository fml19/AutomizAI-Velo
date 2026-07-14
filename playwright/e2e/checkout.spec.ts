import { any } from 'zod/v4'
import { test, expect } from '../support/fixtures'
import { deleteOrderByCpf } from '../support/database/orderRepository'

test.describe('Checkout', () => {


  test.describe('Validações de campos obrigatórios', () => {

    let alerts: any

    test.beforeEach(async ({ page, app }) => {
      await page.goto('/order')
      await expect(page.getByRole('heading', { name: 'Finalizar Pedido' })).toBeVisible()

      alerts = app.checkout.elements.alerts
    })

    test('deve validar obrigatoriedade de todos os campos em branco', async ({ app }) => {

      // Act
      await app.checkout.submit()

      // Assert
      await expect(alerts.name).toHaveText('Nome deve ter pelo menos 2 caracteres')
      await expect(alerts.lastname).toHaveText('Sobrenome deve ter pelo menos 2 caracteres')
      await expect(alerts.email).toHaveText('Email inválido')
      await expect(alerts.phone).toHaveText('Telefone inválido')
      await expect(alerts.document).toHaveText('CPF inválido')
      await expect(alerts.store).toHaveText('Selecione uma loja')
      await expect(alerts.terms).toHaveText('Aceite os termos')
    })

    test('deve validar limite mínimo de caracteres para Nome e Sobrenome', async ({ app }) => {
      const custmer = {
        name: 'A',
        lastname: 'B',
        email: 'teste2026@teste2026.com',
        phone: '(11) 12345-6789',
        document: '92113486091'
      }

      // Arrange
      await app.checkout.fillCustomerData(custmer)
      await app.checkout.selectStore('Velô Paulista')
      await app.checkout.acceptTerms()

      // Act
      await app.checkout.submit()

      // Assert
      await expect(alerts.name).toHaveText('Nome deve ter pelo menos 2 caracteres')
      await expect(alerts.lastname).toHaveText('Sobrenome deve ter pelo menos 2 caracteres')
    })

    test('deve exibir erro para e-mail com formato inválido', async ({ app }) => {
      // Arrange
      const custmer = {
        name: 'Fernando',
        lastname: 'teste',
        email: 'teste2026@com',
        phone: '(11) 12345-6789',
        document: '92113486091'
      }

      // Arrange
      await app.checkout.fillCustomerData(custmer)
      await app.checkout.selectStore('Velô Paulista')
      await app.checkout.acceptTerms()

      // Act
      await app.checkout.submit()

      // Assert
      await expect(alerts.email).toHaveText('Email inválido')
    })

    test('deve exibir erro para CPF inválido', async ({ app }) => {
      // Arrange
      const custmer = {
        name: 'Fernando',
        lastname: 'teste',
        email: 'teste2026@com',
        phone: '(11) 12345-6789',
        document: '123'
      }

      // Arrange
      await app.checkout.fillCustomerData(custmer)
      await app.checkout.selectStore('Velô Paulista')
      await app.checkout.acceptTerms()

      // Act
      await app.checkout.submit()

      // Assert
      await expect(alerts.document).toHaveText('CPF inválido')
    })

    test('deve exigir o aceite dos termos ao finalizar com dados válidos', async ({ app }) => {

      // Arrange
      const custmer = {
        name: 'Fernando',
        lastname: 'teste',
        email: 'teste2026@com.com',
        phone: '(11) 12345-6789',
        document: '92113486091'
      }

      // Arrange
      await app.checkout.fillCustomerData(custmer)
      await app.checkout.selectStore('Velô Paulista')

      await expect(app.checkout.elements.terms).not.toBeChecked()

      // Act
      await app.checkout.submit()

      // Assert
      await expect(alerts.terms).toHaveText('Aceite os termos')
    })
  })

  test.describe('Pagamento à vista', () => {
    test('CT05 - deve criar um pedido aprovado com pagamento à vista', async ({ page, app }) => {
      const customer = {
        name: 'Fernando',
        lastname: 'ML',
        email: 'fernando.ml.ct05@example.com',
        phone: '11987654321',
        document: '92113486091',
        store: 'Velô Paulista',
        totalPrice: 'R$ 40.000,00',
        PaymentMethod: 'À Vista'
      }

      await deleteOrderByCpf(customer.document)

      // Arrange
      await page.goto('/')
      await page.getByRole('link', { name: /Configure Agora/i }).click()

      await app.configurator.expectPrice(customer.totalPrice)
      await app.configurator.finishConfigurator()
      await app.checkout.expectLoaded()

      await app.checkout.fillCustomerData(customer)
      await app.checkout.selectStore(customer.store)

      //Act
      await app.checkout.selectPaymentMethod(customer.PaymentMethod)
      await app.checkout.expectSummaryTotal(customer.totalPrice)
      await app.checkout.acceptTerms()
      await app.checkout.submit()

      // Assert
      await expect(page).toHaveURL(/\/success/)
      await expect(page.getByRole('heading', { name: 'Pedido Aprovado!' }))
    })
  })
})
