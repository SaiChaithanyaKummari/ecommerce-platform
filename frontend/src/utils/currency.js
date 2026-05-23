export const formatIndianCurrency = (value) => {
  const numericValue = Number(value ?? 0);

  if (Number.isNaN(numericValue)) {
    return '₹0.00';
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(numericValue);
};
