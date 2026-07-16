import { describe, expect, it } from 'vitest';

import {
  calculateInstallment,
  calculateTotalPrice,
  formatPrice,
  type CarConfiguration,
} from './configuratorStore';

const createConfiguration = (
  overrides: Partial<CarConfiguration> = {},
): CarConfiguration => ({
  exteriorColor: 'glacier-blue',
  interiorColor: 'carbon-black',
  wheelType: 'aero',
  optionals: [],
  ...overrides,
});

describe('calculateTotalPrice', () => {
  it('returns the base price for aero wheels without optionals', () => {
    expect(calculateTotalPrice(createConfiguration())).toBe(40000);
  });

  it('adds the sport wheels price', () => {
    const configuration = createConfiguration({ wheelType: 'sport' });

    expect(calculateTotalPrice(configuration)).toBe(42000);
  });

  it.each([
    ['precision-park', 45500],
    ['flux-capacitor', 45000],
  ] as const)('adds the %s optional price', (optional, expectedPrice) => {
    const configuration = createConfiguration({ optionals: [optional] });

    expect(calculateTotalPrice(configuration)).toBe(expectedPrice);
  });

  it('adds sport wheels and all optionals', () => {
    const configuration = createConfiguration({
      wheelType: 'sport',
      optionals: ['precision-park', 'flux-capacitor'],
    });

    expect(calculateTotalPrice(configuration)).toBe(52500);
  });

  it('ignores optionals that do not have a known price', () => {
    const configuration = createConfiguration({
      optionals: ['unknown-optional'],
    } as unknown as Partial<CarConfiguration>);

    expect(calculateTotalPrice(configuration)).toBe(40000);
  });

  it('uses an empty list when optionals is not an array', () => {
    const configuration = createConfiguration({
      optionals: null,
    } as unknown as Partial<CarConfiguration>);

    expect(calculateTotalPrice(configuration)).toBe(40000);
  });
});

describe('calculateInstallment', () => {
  it('calculates 12 installments with 2% monthly compound interest', () => {
    expect(calculateInstallment(40000)).toBe(3782.38);
  });

  it('returns zero installments for a zero total', () => {
    expect(calculateInstallment(0)).toBe(0);
  });
});

describe('formatPrice', () => {
  it.each([
    [40000, 'R$\u00a040.000,00'],
    [1234.56, 'R$\u00a01.234,56'],
    [0, 'R$\u00a00,00'],
  ])('formats %s as Brazilian currency', (value, expectedPrice) => {
    expect(formatPrice(value)).toBe(expectedPrice);
  });
});
