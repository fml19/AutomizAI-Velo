import { test, expect } from '@playwright/test';
import { generateOrderCode } from '../support/helperrs'
import { OrdeLockupPage } from '../support/pages/OrderLockupPage0';

/// AAA - Arrange(Preparar), Act(Agir), Assert(Verificar)

test.describe('Consulta de Pedido', () => {

  test.beforeEach(async ({ page }) => {

    // Arrange
    await page.goto('http://localhost:5173/');
    await expect(page.getByTestId('hero-section').getByRole('heading')).toContainText('Velô Sprint');
    // Act
    await page.getByRole('link', { name: 'Consultar Pedido' }).click();
    await expect(page.getByRole('heading', { name: 'Consultar Pedido' })).toBeVisible({ timeout: 10000 });
  })

  test('deve consultar um pedido aprovado', async ({ page }) => {

    //Test Date
    const order = 'VLO-Z69QA0'

    //Act
    const orderLockupPage = new OrdeLockupPage(page)
    await orderLockupPage.searchOrder(order)

    //Assert
    await expect(page.getByText(order, { exact: true })).toBeVisible();
    await expect(page.getByText('APROVADO', { exact: true })).toBeVisible();

  })

  test('deve consultar um pedido aprovado utilizando Assert Snapshot', async ({ page }) => {

    //Test Date
    const order = 'VLO-Z69QA0'

    //Act
    const orderLockupPage = new OrdeLockupPage(page)
    await orderLockupPage.searchOrder(order)

    //Assert
    await expect(page.getByTestId(`order-result-${order}`)).toMatchAriaSnapshot(`
    - paragraph: Pedido
    - paragraph: ${order}
    - status:
      - img
      - text: APROVADO
    - img "Velô Sprint"
    - paragraph: Modelo
    - paragraph: Velô Sprint
    - paragraph: Cor
    - paragraph: Glacier Blue
    - paragraph: Interior
    - paragraph: cream
    - paragraph: Rodas
    - paragraph: aero Wheels
    - heading "Dados do Cliente" [level=4]
    - paragraph: Nome
    - paragraph: teste2 teste2
    - paragraph: Email
    - paragraph: teste2@gmail.com
    - paragraph: Loja de Retirada
    - paragraph
    - paragraph: Data do Pedido
    - paragraph: /\\d+\\/\\d+\\/\\d+/
    - heading "Pagamento" [level=4]
    - paragraph: À Vista
    - paragraph: /R\\$ \\d+\\.\\d+,\\d+/
    `);

    const statusBadge = page.getByRole('status').filter({ hasText: 'APROVADO' })

    await expect(statusBadge).toHaveClass(/bg-green-100/)
    await expect(statusBadge).toHaveClass(/text-green-700/)

    const statusIcon = statusBadge.locator('svg')
    await expect(statusIcon).toHaveClass(/lucide lucide-circle-check-big/)

  })


  test('deve exibir mensagem quando o pedido não é encontrado', async ({ page }) => {

    const order = generateOrderCode()

    await page.getByTestId('search-order-id').fill(order);
    await page.getByRole('button', { name: 'Buscar Pedido' }).click();

    //Assert
    //Pode ser feito assim
    // const title = page.getByRole('heading', { name: 'Pedido não encontrado' })
    // await expect(title).toBeVisible()

    // const message = page.locator('p', { hasText: 'Verifique o número do pedido e tente novamente' })
    // await expect(message).toBeVisible()
    //OU
    await expect(page.locator('#root')).toMatchAriaSnapshot(`
    - img
    - heading "Pedido não encontrado" [level=3]
    - paragraph: Verifique o número do pedido e tente novamente
    `);
  })

  test('deve consultar um pedido Reprovado utilizando Assert Snapshot', async ({ page }) => {

    //Test Date
    const order = {
      number: 'VLO-7T2HW8',
      status: 'REPROVADO',
      color: 'Glacier Blue',
      wheels: 'aero Wheels',
      customer: {
        name: 'Teste3 Teste3',
        email: 'Teste3@Teste.com.br'
      }
    }

    //Act
    const orderLockupPage = new OrdeLockupPage(page)
    await orderLockupPage.searchOrder(order.number)

    //Assert
    await expect(page.getByTestId(`order-result-${order.number}`)).toMatchAriaSnapshot(`
    - paragraph: Pedido
    - paragraph: ${order.number}
    - status:
      - img
      - text: ${order.status}
    - img "Velô Sprint"
    - paragraph: Modelo
    - paragraph: Velô Sprint
    - paragraph: Cor
    - paragraph: ${order.color}
    - paragraph: Interior
    - paragraph: cream
    - paragraph: Rodas
    - paragraph: ${order.wheels}
    - heading "Dados do Cliente" [level=4]
    - paragraph: Nome
    - paragraph: ${order.customer.name}
    - paragraph: Email
    - paragraph: ${order.customer.email}
    - paragraph: Loja de Retirada
    - paragraph
    - paragraph: Data do Pedido
    - paragraph: /\\d+\\/\\d+\\/\\d+/
    - heading "Pagamento" [level=4]
    - paragraph: À Vista
    - paragraph: /R\\$ \\d+\\.\\d+,\\d+/
    `);
    const statusBadge = page.getByRole('status').filter({ hasText: order.status })

    await expect(statusBadge).toHaveClass(/bg-red-100/)
    await expect(statusBadge).toHaveClass(/text-red-700/)

    const statusIcon = statusBadge.locator('svg')
    await expect(statusIcon).toHaveClass(/lucide lucide-circle-x/)
  })

  test('deve consultar um pedido EM_ANALISE utilizando Assert Snapshot', async ({ page }) => {

    //Test Date
    const order = {
      number: 'VLO-98QS25',
      status: 'EM_ANALISE',
      color: 'Midnight Black',
      wheels: 'sport Wheels',
      customer: {
        name: 'teste 0 teste 0',
        email: 'teste0@teste0.com.br'
      }
    }

    //Act
    const orderLockupPage = new OrdeLockupPage(page)
    await orderLockupPage.searchOrder(order.number)

    //Assert
    await expect(page.getByTestId(`order-result-${order.number}`)).toMatchAriaSnapshot(`
    - paragraph: Pedido
    - paragraph: ${order.number}
    - status:
      - img
      - text: ${order.status}
    - img "Velô Sprint"
    - paragraph: Modelo
    - paragraph: Velô Sprint
    - paragraph: Cor
    - paragraph: ${order.color}
    - paragraph: Interior
    - paragraph: cream
    - paragraph: Rodas
    - paragraph: ${order.wheels}
    - heading "Dados do Cliente" [level=4]
    - paragraph: Nome
    - paragraph: ${order.customer.name}
    - paragraph: Email
    - paragraph: ${order.customer.email}
    - paragraph: Loja de Retirada
    - paragraph
    - paragraph: Data do Pedido
    - paragraph: /\\d+\\/\\d+\\/\\d+/
    - heading "Pagamento" [level=4]
    - paragraph: À Vista
    - paragraph: /R\\$ \\d+\\.\\d+,\\d+/
    `);

    const statusBadge = page.getByRole('status').filter({ hasText: order.status })

    await expect(statusBadge).toHaveClass(/bg-amber-100/)
    await expect(statusBadge).toHaveClass(/text-amber-700/)

    const statusIcon = statusBadge.locator('svg')
    await expect(statusIcon).toHaveClass(/lucide lucide-clock/)
  })
})


