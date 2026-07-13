/**
 * @file Helpers de calendário para regra de check-in no dia do evento.
 * @module modules/ticketing/application/helpers/eventDay
 */

const CHECK_IN_TIMEZONE = "America/Sao_Paulo";

/** Indica se `eventDate` e `referenceDate` caem no mesmo dia civil em São Paulo. */
export function isEventDay(eventDate: Date, referenceDate = new Date()): boolean {
  return formatCalendarDay(eventDate) === formatCalendarDay(referenceDate);
}

/** Formata data como YYYY-MM-DD no fuso America/Sao_Paulo. */
export function formatCalendarDay(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: CHECK_IN_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
