import { test, expect } from '@playwright/test';

/// AAA - Arrange(Preparar), Act(Agir), Assert(Verificar)

test('deve consultar um pedido aprovado', async ({ page }) => {

  // Arrange
  await page.goto('http://localhost:5173/');
  await expect(page.getByTestId('hero-section').getByRole('heading')).toContainText('Velô Sprint');

  // Act
  await page.getByRole('link', { name: 'Consultar Pedido' }).click();
  await expect(page.getByRole('heading', { name: 'Consultar Pedido' })).toBeVisible({ timeout: 10000 });
  await page.getByTestId('search-order-id').fill('VLO-Z69QA0');
  //linha excluida a nivel de aula// await page.getByTestId('search-order-button').click();
  await page.getByRole('button', { name: 'Buscar Pedido' }).click();

  //Assert
  //linha excluida a nivel de aula//await expect(page.getByTestId('order-result-id')).toContainText('VLO-Z69QA0');
  await expect(page.getByText('VLO-Z69QA0', { exact: true })).toBeVisible();
  //linha excluida a nivel de aula// await expect(page.getByTestId('order-result-status')).toContainText('APROVADO');
  await expect(page.getByText('APROVADO', { exact: true })).toBeVisible();

});
