import { test, expect } from '@playwright/test'

import { generateOrderCode } from '../support/helperrs'

import { Navbar } from '../support/components/Navbar'
import { LandingPage } from '../support/pages/LandingPage'
import { OrderLockupPage, OrderDetails } from '../support/pages/OrderLockupPage'

/// AAA - Arrange, Act, Assert

test.describe('Consulta de Pedido', () => {

  let orderLockupPage: OrderLockupPage

  test.beforeEach(async ({ page }) => {
    // Arrange - Landing
    await new LandingPage(page).goto()

    // Arrange - Navegação via componente compartilhado
    await new Navbar(page).orderLockuplink()

    // Assent - Confirmar que estamos na página compartilhada
    orderLockupPage = new OrderLockupPage(page)
    await new OrderLockupPage(page).validatePageLoaded()

  })

  test('deve consultar um pedido aprovado', async ({ page }) => {

    // Test Data
    const order: OrderDetails = {
      number: 'VLO-Z69QA0',
      status: 'APROVADO',
      color: 'Glacier Blue',
      wheels: 'aero Wheels',
      customer: {
        name: 'teste2 teste2',
        email: 'teste2@gmail.com'
      },
      payment: 'À Vista'
    }

    // Act
    await orderLockupPage.searchOrder(order.number)

    // Assert
    await orderLockupPage.validadeOrderDetails(order)

    // Validação do badge de status encapsulada no Page Object
    await orderLockupPage.validateStatusBadge(order.status)

  })

  test('deve consultar um pedido reprovado', async ({ page }) => {

    // Test Data
    const order: OrderDetails = {
      number: 'VLO-7T2HW8',
      status: 'REPROVADO',
      color: 'Glacier Blue',
      wheels: 'aero Wheels',
      customer: {
        name: 'Teste3 Teste3',
        email: 'Teste3@Teste.com.br'
      },
      payment: 'À Vista'
    }

    // Act
    await orderLockupPage.searchOrder(order.number)

    // Assert
    await orderLockupPage.validadeOrderDetails(order)

    // Validação do badge de status encapsulada no Page Object
    await orderLockupPage.validateStatusBadge(order.status)
  })

  test('deve consultar um pedido em analise', async ({ page }) => {

    // Test Data
    const order: OrderDetails = {
      number: 'VLO-98QS25',
      status: 'EM_ANALISE',
      color: 'Midnight Black',
      wheels: 'sport Wheels',
      customer: {
        name: 'teste 0 teste 0',
        email: 'teste0@teste0.com.br'
      },
      payment: 'À Vista'
    }

    // Act
    await orderLockupPage.searchOrder(order.number)

    // Assert
    await orderLockupPage.validadeOrderDetails(order)

    // Validação do badge de status encapsulada no Page Object
    await orderLockupPage.validateStatusBadge(order.status)
  })

  test('deve exibir mensagem quando o pedido não é encontrado', async ({ page }) => {
    const order = generateOrderCode()

    await orderLockupPage.searchOrder(order)
    await orderLockupPage.validadeOrderDetaNotFound()

  })

  test('deve exibir mensagem quando o código do pedido sta fora do padrão', async ({ page }) => {
    const orderCode = 'XYZ-999-INVALIDO'

    await orderLockupPage.searchOrder(orderCode)
    await orderLockupPage.validadeOrderDetaNotFound()

  })
})
