import { test, type App } from '../support/fixtures'

type OptionalFeature = 'Precision Park' | 'Flux Capacitor'

type VehicleScenario = {
  id: string
  name: string
  color: string
  wheels: string | RegExp
  optionals: OptionalFeature[]
  expectedTotal: string
}

const ct0301: VehicleScenario = {
  id: 'CT03-01',
  name: 'Glacier Blue, Aero Wheels e sem opcional',
  color: 'Glacier Blue',
  wheels: /Aero Wheels/,
  optionals: [],
  expectedTotal: 'R$ 40.000,00',
}

const ct0302: VehicleScenario = {
  id: 'CT03-02',
  name: 'Glacier Blue, Aero Wheels e opcional Precision Park',
  color: 'Glacier Blue',
  wheels: /Aero Wheels/,
  optionals: ['Precision Park'],
  expectedTotal: 'R$ 45.500,00',
}

const ct0303: VehicleScenario = {
  id: 'CT03-03',
  name: 'Lunar White, Aero Wheels e opcional Flux Capacitor',
  color: 'Lunar White',
  wheels: /Aero Wheels/,
  optionals: ['Flux Capacitor'],
  expectedTotal: 'R$ 45.000,00',
}

const ct0304: VehicleScenario = {
  id: 'CT03-04',
  name: 'Glacier Blue, Aero Wheels e opcionais Precision Park e Flux Capacitor',
  color: 'Glacier Blue',
  wheels: /Aero Wheels/,
  optionals: ['Precision Park', 'Flux Capacitor'],
  expectedTotal: 'R$ 50.500,00',
}

const ct0305: VehicleScenario = {
  id: 'CT03-05',
  name: 'Midnight Black, Sport Wheels e sem opcional',
  color: 'Midnight Black',
  wheels: /Sport Wheels/,
  optionals: [],
  expectedTotal: 'R$ 42.000,00',
}

const ct0306: VehicleScenario = {
  id: 'CT03-06',
  name: 'Midnight Black, Sport Wheels e opcional Precision Park',
  color: 'Midnight Black',
  wheels: /Sport Wheels/,
  optionals: ['Precision Park'],
  expectedTotal: 'R$ 47.500,00',
}

const ct0307: VehicleScenario = {
  id: 'CT03-07',
  name: 'Midnight Black, Sport Wheels e opcional Flux Capacitor',
  color: 'Midnight Black',
  wheels: /Sport Wheels/,
  optionals: ['Flux Capacitor'],
  expectedTotal: 'R$ 47.000,00',
}

const ct0308: VehicleScenario = {
  id: 'CT03-08',
  name: 'Midnight Black, Sport Wheels e opcionais Precision Park e Flux Capacitor',
  color: 'Midnight Black',
  wheels: /Sport Wheels/,
  optionals: ['Precision Park', 'Flux Capacitor'],
  expectedTotal: 'R$ 52.500,00',
}

async function createOrderWithConfiguration(app: App, scenario: VehicleScenario) {
  await app.configurator.resetState()
  await app.configurator.openFromLanding()

  await app.configurator.expectPrice('R$ 40.000,00')
  await app.configurator.selectColor(scenario.color)
  await app.configurator.selectWheels(scenario.wheels)

  for (const optional of scenario.optionals) {
    await app.configurator.selectOptional(optional)
  }

  await app.configurator.expectPrice(scenario.expectedTotal)
  await app.configurator.submitOrder()

  await app.checkout.createCashOrder(
    scenario.expectedTotal,
    {
      name: 'Cliente',
      surname: scenario.id,
      email: `cliente.${scenario.id.toLowerCase()}.${Date.now()}@email.com`,
      phone: '11999999999',
      cpf: `1234567890${scenario.id.slice(-1)}`,
    },
    'Velô Paulista - Av. Paulista, 1000',
  )

  await app.success.expectApprovedOrderWithTotal(scenario.expectedTotal)
}

test.describe('CT03 - Opcionais do veículo: cálculo do total e criação de pedido aprovado', () => {
  test('CT03-01 - deve manter o total em R$ 40.000,00 e criar pedido para Glacier Blue, Aero Wheels e sem opcional', async ({ app }) => {
    await createOrderWithConfiguration(app, ct0301)
  })

  test('CT03-02 - deve calcular total de R$ 45.500,00 e criar pedido para Glacier Blue, Aero Wheels e opcional Precision Park', async ({ app }) => {
    await createOrderWithConfiguration(app, ct0302)
  })

  test('CT03-03 - deve calcular total de R$ 45.000,00 e criar pedido para Lunar White, Aero Wheels e opcional Flux Capacitor', async ({ app }) => {
    await createOrderWithConfiguration(app, ct0303)
  })

  test('CT03-04 - deve calcular total de R$ 50.500,00 e criar pedido para Glacier Blue, Aero Wheels e opcionais Precision Park e Flux Capacitor', async ({ app }) => {
    await createOrderWithConfiguration(app, ct0304)
  })

  test('CT03-05 - deve calcular total de R$ 42.000,00 e criar pedido para Midnight Black, Sport Wheels e sem opcional', async ({ app }) => {
    await createOrderWithConfiguration(app, ct0305)
  })

  test('CT03-06 - deve calcular total de R$ 47.500,00 e criar pedido para Midnight Black, Sport Wheels e opcional Precision Park', async ({ app }) => {
    await createOrderWithConfiguration(app, ct0306)
  })

  test('CT03-07 - deve calcular total de R$ 47.000,00 e criar pedido para Midnight Black, Sport Wheels e opcional Flux Capacitor', async ({ app }) => {
    await createOrderWithConfiguration(app, ct0307)
  })

  test('CT03-08 - deve calcular total de R$ 52.500,00 e criar pedido para Midnight Black, Sport Wheels e opcionais Precision Park e Flux Capacitor', async ({ app }) => {
    await createOrderWithConfiguration(app, ct0308)
  })
})
