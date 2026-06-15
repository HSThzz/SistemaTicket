export function eventDateToIso(value: Date): string {
  return value.toISOString();
}

export function isoToEventDate(isoDate: string): Date {
  return new Date(isoDate);
}

export function startOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export function validateEventDate(
  value: Date | null,
  options: { allowPast?: boolean } = {},
): string | null {
  if (!value || Number.isNaN(value.getTime())) {
    return "Informe a data do evento";
  }

  if (!options.allowPast && value.getTime() < Date.now()) {
    return "A data do evento deve ser no futuro";
  }

  return null;
}
