import { describe, expect, it } from 'vitest';

import { calculateFinancing, determineCreditStatus } from './checkout';

describe('checkout domain rules', () => {
  it('determines the credit status at score and down-payment boundaries', () => {
    const scenarios = [
      { score: 701, entryValue: 0, expected: 'APROVADO' },
      { score: 700, entryValue: 0, expected: 'EM_ANALISE' },
      { score: 501, entryValue: 0, expected: 'EM_ANALISE' },
      { score: 500, entryValue: 0, expected: 'REPROVADO' },
      { score: 500, entryValue: 20000, expected: 'APROVADO' },
      { score: 500, entryValue: 19999.99, expected: 'REPROVADO' },
    ] as const;

    scenarios.forEach(({ score, entryValue, expected }) => {
      expect(
        determineCreditStatus({ score, entryValue, totalPrice: 40000 }),
      ).toBe(expected);
    });
  });

  it('calculates installments, interest and final price after the down payment', () => {
    expect(
      calculateFinancing({ totalPrice: 40000, entryValue: 10000 }),
    ).toEqual({
      entryValue: 10000,
      amountToFinance: 30000,
      installmentValue: 2836.79,
      totalFinanced: 34041.48,
      interestAmount: 4041.48,
      finalPrice: 44041.48,
    });

    expect(
      calculateFinancing({ totalPrice: 40000, entryValue: 40000 }),
    ).toEqual({
      entryValue: 40000,
      amountToFinance: 0,
      installmentValue: 0,
      totalFinanced: 0,
      interestAmount: 0,
      finalPrice: 40000,
    });
  });
});
