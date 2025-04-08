const DEFAULT_EUROS_OPTIONS: Intl.NumberFormatOptions = {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
};

const DEFAULT_METRIC_OPTIONS: Intl.NumberFormatOptions = {
  style: "decimal",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
};

export interface EurosFormatOptions {
  showDigits?: boolean;
}

export function formatEuros(
  amount: number | undefined | null,
  options?: EurosFormatOptions,
): string {
  if (amount === undefined || amount === null) {
    return "N/A";
  }

  const { showDigits = true } = options || {};

  const digitOptions = showDigits
    ? { minimumFractionDigits: 2, maximumFractionDigits: 2 }
    : { minimumFractionDigits: 0, maximumFractionDigits: 0 };

  return new Intl.NumberFormat("fr-FR", {
    ...DEFAULT_EUROS_OPTIONS,
    ...digitOptions,
  }).format(amount);
}

export function formatMetric(
  value: number | string | undefined | null,
  options?: Partial<Intl.NumberFormatOptions>,
): string {
  if (typeof value === "string") {
    return value;
  }

  if (value === undefined || value === null) {
    return "N/A";
  }

  return new Intl.NumberFormat("fr-FR", {
    ...DEFAULT_METRIC_OPTIONS,
    ...options,
  }).format(value);
}

export function formatDate(date?: Date | string | null): string {
  if (!date) return "Non disponible";
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
