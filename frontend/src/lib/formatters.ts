/**
 * Standard formatting utilities for dates, times, and currency amounts across the CMS frontend.
 */

/**
 * Format numeric monetary values into localized currency strings with symbol.
 * Default currency is Bangladeshi Taka (৳).
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  currencySymbol = "৳"
): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return `${currencySymbol}0`;
  }
  const numericValue = Number(amount);
  return `${currencySymbol}${numericValue.toLocaleString()}`;
}

/**
 * Format ISO date strings or Date objects into human-readable date strings.
 * Defaults to 'MMM DD, YYYY' format (e.g., 'Oct 19, 2026').
 */
export function formatDate(
  date: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return "—";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "—";

    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
    };

    return d.toLocaleDateString("en-US", options || defaultOptions);
  } catch {
    return "—";
  }
}

/**
 * Format ISO date strings or Date objects into date and time strings.
 * E.g., 'Oct 19, 2026, 10:30 PM'
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "—";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "—";

    return d.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "—";
  }
}

/**
 * Format a number with localized thousands separators.
 */
export function formatNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return "0";
  }
  return Number(value).toLocaleString();
}
