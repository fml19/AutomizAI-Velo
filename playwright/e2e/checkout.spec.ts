import { test, expect, type App } from '../support/fixtures'
import { deleteOrderByCustomer } from '../support/database/orderRepository'
import { mockCreditAnalysis } from '../support/mock.api'

type PaymentCustomer = {
  name: string
  lastname: string
  email: string
  phone: string
  document: string
  store: string
  totalPrice: string
  paymentMethod: string
  downPayment?: string
}

async function prepareBasicCheckout(app: App, customer: PaymentCustomer) {
  await deleteOrderByCustomer(customer)
  await app.configurator.openFromLanding()
  await app.configurator.expectPrice(customer.totalPrice)
  await app.configurator.finishConfigurator()
  await app.checkout.expectLoaded()
  await app.checkout.fillCustomerData(customer)
  await app.checkout.selectStore(customer.store)
}

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

  test.describe('Pagamento e Confirmação', () => {

    test.beforeEach(async ({ app }) => {
      await app.hero.open()
    })


    test('CT05 - deve criar um pedido aprovado com pagamento à vista', async ({ app }) => {
      const customer: PaymentCustomer = {
        name: 'Fernando',
        lastname: 'ML',
        email: 'fernando.ml.ct05@example.com',
        phone: '11987654321',
        document: '92113486091',
        store: 'Velô Paulista',
        totalPrice: 'R$ 40.000,00',
        paymentMethod: 'À Vista'
      }

      // Arrange
      await prepareBasicCheckout(app, customer)

      // Act
      await app.checkout.submitPayment(customer.paymentMethod, { expectedTotal: customer.totalPrice })

      // Assert
      await app.checkout.expectResult('Pedido Aprovado!')
      //await app.success.expectOrderStatus('Pedido Aprovado!')
    })

    test('deve aprovar automaticamente o crédito quando o score do CPF for maior que 700 no financiamento', async ({ page, app }) => {
      const customer: PaymentCustomer = {
        name: 'Lara',
        lastname: 'Croft',
        email: 'lara.croft.ct06@example.com',
        phone: '11987654321',
        document: '24688318022',
        store: 'Velô Paulista',
        totalPrice: 'R$ 40.000,00',
        paymentMethod: 'Financiamento'
      }

      // Arrange
      // await mockCreditAnalysis(page, 701) também da para fazer assim
      await app.mock.creditAnalysis(701)
      await prepareBasicCheckout(app, customer)

      // Act
      await app.checkout.submitPayment(customer.paymentMethod)

      // Assert
      await app.checkout.expectResult('Pedido Aprovado!')
      //await app.success.expectOrderStatus('Pedido Aprovado!')
    })

    test('deve encaminhar para análise de crédito quando o score do CPF for entre 501 e 700 no financiamento', async ({ page, app }) => {
      const customer: PaymentCustomer = {
        name: 'Lucy',
        lastname: 'Suan',
        email: 'Lucy@suan.com',
        document: '74690251037',
        phone: '(11) 99999-9999',
        store: 'Velô Paulista',
        paymentMethod: 'Financiamento',
        totalPrice: 'R$ 40.000,00'
      }

      // Arrange
      await app.mock.creditAnalysis(600)
      await prepareBasicCheckout(app, customer)

      // Act
      await app.checkout.submitPayment(customer.paymentMethod)

      // Assert
      await app.checkout.expectResult('Pedido em Análise!')
      //await app.success.expectOrderStatus('Pedido em Análise!')
    })

    test('deve reprovar o crédito sem entrada quando o score do CPF for menor ou igual a 500 no financiamento', async ({ page, app }) => {
      const customer: PaymentCustomer = {
        name: 'Bruce',
        lastname: 'Wayne',
        email: 'bruce@wayne.com',
        document: '52998224725',
        phone: '(11) 99999-9999',
        store: 'Velô Paulista',
        paymentMethod: 'Financiamento',
        totalPrice: 'R$ 40.000,00'
      }

      // Arrange
      await app.mock.creditAnalysis(500)
      await prepareBasicCheckout(app, customer)

      // Act
      await app.checkout.submitPayment(customer.paymentMethod)

      // Assert
      //await app.checkout.expectResult('Pedido Reprovado!')
      await app.success.expectOrderStatus('Pedido Reprovado!')
    })

    test('deve reprovar o crédito quando o score do CPF for menor ou igual a 500 no financiamento com entrada igual a 50%', async ({ page, app }) => {
      const customer: PaymentCustomer = {
        name: 'Peter',
        lastname: 'Parker',
        email: 'peter@parker.com',
        document: '11144477735',
        phone: '(11) 98888-8888',
        store: 'Velô Paulista',
        paymentMethod: 'Financiamento',
        totalPrice: 'R$ 40.000,00',
        downPayment: '10000'
      }

      // Arrange
      await app.mock.creditAnalysis(500)
      await prepareBasicCheckout(app, customer)

      // Act
      await app.checkout.submitPayment(customer.paymentMethod, { downPayment: customer.downPayment })

      // Assert
      await app.success.expectOrderStatus('Pedido Reprovado!')
      //await app.success.expectOrderStatus('Pedido Reprovado!')
    })

    test('deve aprovar o crédito quando o score do CPF for menor ou igual a 500 no financiamento com entrada maior que 50%', async ({ page, app }) => {
      const customer: PaymentCustomer = {
        name: 'Erza',
        lastname: 'Scarlet',
        email: 'erza@scarlet.com',
        document: '16899535009',
        phone: '(11) 98888-8888',
        store: 'Velô Paulista',
        paymentMethod: 'Financiamento',
        totalPrice: 'R$ 40.000,00',
        downPayment: '30000'
      }

      // Arrange
      await app.mock.creditAnalysis(300)
      await prepareBasicCheckout(app, customer)

      // Act
      await app.checkout.submitPayment(customer.paymentMethod, { downPayment: customer.downPayment })

      // Assert
      await app.success.expectOrderStatus('Pedido Aprovado!')
    })
  })

})
