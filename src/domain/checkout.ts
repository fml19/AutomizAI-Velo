export type CreditStatus = 'APROVADO' | 'REPROVADO' | 'EM_ANALISE';

type CreditDecisionInput = {
  score: number;
  entryValue: number;
  totalPrice: number;
};

type FinancingInput = {
  totalPrice: number;
  entryValue: number;
  months?: number;
  monthlyRate?: number;
};

export type FinancingSummary = {
  entryValue: number;
  amountToFinance: number;
  installmentValue: number;
  totalFinanced: number;
  interestAmount: number;
  finalPrice: number;
};

const roundCurrency = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export const determineCreditStatus = ({
  score,
  entryValue,
  totalPrice,
}: CreditDecisionInput): CreditStatus => {
  const entryPercentage = totalPrice > 0 ? entryValue / totalPrice : 0;

  if (entryPercentage >= 0.5 && score < 700) {
    return 'APROVADO';
  }

  if (score > 700) {
    return 'APROVADO';
  }

  if (score >= 501) {
    return 'EM_ANALISE';
  }

  return 'REPROVADO';
};

export const calculateFinancing = ({
  totalPrice,
  entryValue,
  months = 12,
  monthlyRate = 0.02,
}: FinancingInput): FinancingSummary => {
  const normalizedTotal = Math.max(0, totalPrice);
  const normalizedEntry = Math.min(
    normalizedTotal,
    Math.max(0, entryValue),
  );
  const amountToFinance = roundCurrency(normalizedTotal - normalizedEntry);

  if (amountToFinance === 0) {
    return {
      entryValue: normalizedEntry,
      amountToFinance: 0,
      installmentValue: 0,
      totalFinanced: 0,
      interestAmount: 0,
      finalPrice: normalizedEntry,
    };
  }

  const compoundFactor = Math.pow(1 + monthlyRate, months);
  const installmentValue = roundCurrency(
    (amountToFinance * monthlyRate * compoundFactor) /
      (compoundFactor - 1),
  );
  const totalFinanced = roundCurrency(installmentValue * months);

  return {
    entryValue: normalizedEntry,
    amountToFinance,
    installmentValue,
    totalFinanced,
    interestAmount: roundCurrency(totalFinanced - amountToFinance),
    finalPrice: roundCurrency(normalizedEntry + totalFinanced),
  };
};
