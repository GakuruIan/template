export const toNumber = (
  value?: number | string | null | { toString(): string },
) => {
  if (value === null || value === undefined) {
    return 0;
  }

  const numericValue = Number(value.toString());
  return Number.isFinite(numericValue) ? numericValue : 0;
};

export const formatCurrency = (
  value?: number | string | null | { toString(): string },
) =>
  new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
  }).format(toNumber(value));

export const formatDate = (value?: Date | string | null) => {
  if (!value) {
    return '';
  }

  return new Intl.DateTimeFormat('en-KE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));
};
