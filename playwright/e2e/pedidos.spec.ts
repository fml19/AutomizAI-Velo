import { expect, test } from '../support/fixtures'
import { generateOrderCode } from '../support/helperrs'
import { OrderDetails } from '../support/actions/orderLookupActions'
import { insertOrder, deleteOrderByNumber } from '../support/database/orderRepository'
import testData from '../support/fixtures/orders.json' with {type: 'json'}

type OrderScenario = {
  title: string
  order: OrderDetails
}

const orderScenarios = testData as OrderScenario[]

/// AAA - Arrange, Act, Assert
test.describe('Consulta de Pedido', () => {

  test.beforeEach(async ({ app }) => {
    // Arrange - Landing
    await app.orderLookup.open()
  })

  for (const { title, order } of orderScenarios) {
    test(title, async ({ app }) => {
      await deleteOrderByNumber(order.number)

      await insertOrder(order)

      // Act
      await app.orderLookup.searchOrder(order.number)

      // Assert
      await app.orderLookup.validateOrderDetails(order)

      // Validação do badge de status encapsulada na action
      await app.orderLookup.validateStatusBadge(order.status)
    })
  }

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
