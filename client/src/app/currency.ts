export function getCurrency(): string {
  return 'TRY';
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' });
}

export function formatDateOnly(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul' });
}

export function formatWeekday(date: Date): string {
  return date.toLocaleDateString('tr-TR', { weekday: 'short', timeZone: 'Europe/Istanbul' });
}
