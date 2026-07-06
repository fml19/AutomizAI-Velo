import { expect, test } from '../support/fixtures'

import { generateOrderCode } from '../support/helperrs'
import { OrderDetails } from '../support/actions/orderLookupActions'

/// AAA - Arrange, Act, Assert

test.describe('Consulta de Pedido', () => {

  test.beforeEach(async ({ app }) => {
    // Arrange - Landing
    await app.orderLookup.open()
  })

  test('deve consultar um pedido aprovado', async ({ app }) => {

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
    await app.orderLookup.searchOrder(order.number)

    // Assert
    await app.orderLookup.validateOrderDetails(order)

    // Validação do badge de status encapsulada na action
    await app.orderLookup.validateStatusBadge(order.status)

  })

  test('deve consultar um pedido reprovado', async ({ app }) => {

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
    await app.orderLookup.searchOrder(order.number)

    // Assert
    await app.orderLookup.validateOrderDetails(order)

    // Validação do badge de status encapsulada na action
    await app.orderLookup.validateStatusBadge(order.status)
  })

  test('deve consultar um pedido em analise', async ({ app }) => {

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
    await app.orderLookup.searchOrder(order.number)

    // Assert
    await app.orderLookup.validateOrderDetails(order)

    // Validação do badge de status encapsulada na action
    await app.orderLookup.validateStatusBadge(order.status)
  })

  test('deve exibir mensagem quando o pedido não é encontrado', async ({ app }) => {
    const order = generateOrderCode()

    await app.orderLookup.searchOrder(order)
    await app.orderLookup.validateOrderNotFound()

  })

  test('deve exibir mensagem quando o código do pedido sta fora do padrão', async ({ app }) => {
    const orderCode = 'XYZ-999-INVALIDO'

    await app.orderLookup.searchOrder(orderCode)
    await app.orderLookup.validateOrderNotFound()

  })

  test('deve manter o botão desabilitado com campo vazio ou apenas espaço', async ({ app, page }) => {
    const button = app.orderLookup.elements.searchButton
    await expect(button).toBeDisabled()

    await app.orderLookup.elements.orderInput.fill(' ')
    await expect(button).toBeDisabled()

  })
})


