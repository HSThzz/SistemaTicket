/**
 * @file Helpers de path público de eventos (slug nas URLs).
 * @module modules/catalog/utils/eventPaths
 */

/** Evento com ao menos `slug` (e `id` como fallback legado). */
export type EventPathSource = {
  id: string;
  slug?: string | null;
};

/**
 * Path público do evento (`/eventos/:slug`).
 * Usa `id` só se o slug ainda não existir (dados antigos em cache).
 */
export function eventPath(event: EventPathSource): string {
  const segment = event.slug?.trim() || event.id;
  return `/eventos/${segment}`;
}

/** Path de checkout do evento. */
export function eventCheckoutPath(
  event: EventPathSource,
  query?: Record<string, string | undefined>,
): string {
  const base = `${eventPath(event)}/comprar`;
  if (!query) {
    return base;
  }

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") {
      params.set(key, value);
    }
  }

  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}
