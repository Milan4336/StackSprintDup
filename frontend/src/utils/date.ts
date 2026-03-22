export function formatSafeDate(timestamp?: string | number | Date | null): string {
  if (!timestamp) return 'N/A';

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) return 'N/A';

  return date.toLocaleString();
}

export function safeDate(timestamp?: string | number | Date | null): Date | null {
  if (!timestamp) return null;

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) return null;

  return date;
}
