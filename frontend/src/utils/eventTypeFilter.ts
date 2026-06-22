/**
 * @file Filtro de visibilidade (público/privado) para listagens de eventos.
 * @module utils/eventTypeFilter
 */

import type { Event, EventType, ProducerEventStats } from "../types/api";

/** Filtro de tipo de evento na UI. */
export type EventTypeFilter = "all" | "public" | "private";

export const EVENT_TYPE_FILTER_LABELS: Record<EventTypeFilter, string> = {
  all: "Todos",
  public: "Públicos",
  private: "Privados",
};

/** Eventos legados sem `type` são tratados como públicos. */
export function resolveEventType(type: EventType | string | undefined): EventType {
  return type === "PRIVATE" ? "PRIVATE" : "PUBLIC";
}

export function isPrivateEventType(type: EventType | string | undefined): boolean {
  return resolveEventType(type) === "PRIVATE";
}

export function matchesEventTypeFilter(
  type: EventType | string | undefined,
  filter: EventTypeFilter,
): boolean {
  if (filter === "all") {
    return true;
  }

  if (filter === "private") {
    return isPrivateEventType(type);
  }

  return !isPrivateEventType(type);
}

export function filterEventsByType<T extends Pick<Event, "type">>(
  events: T[],
  filter: EventTypeFilter,
): T[] {
  if (filter === "all") {
    return events;
  }

  return events.filter((event) => matchesEventTypeFilter(event.type, filter));
}

export function filterProducerStatsByType(
  events: ProducerEventStats[],
  filter: EventTypeFilter,
): ProducerEventStats[] {
  if (filter === "all") {
    return events;
  }

  return events.filter((event) => matchesEventTypeFilter(event.type, filter));
}

export function computeProducerEventSummary(events: ProducerEventStats[]) {
  return events.reduce(
    (acc, event) => ({
      totalEvents: acc.totalEvents + 1,
      publishedEvents:
        acc.publishedEvents + (event.status === "PUBLISHED" ? 1 : 0),
      draftEvents: acc.draftEvents + (event.status === "DRAFT" ? 1 : 0),
      ticketsSold: acc.ticketsSold + event.ticketsSold,
      ticketsCheckedIn: acc.ticketsCheckedIn + event.ticketsCheckedIn,
      grossRevenueCents: acc.grossRevenueCents + event.grossRevenueCents,
    }),
    {
      totalEvents: 0,
      publishedEvents: 0,
      draftEvents: 0,
      ticketsSold: 0,
      ticketsCheckedIn: 0,
      grossRevenueCents: 0,
    },
  );
}

export function countEventsByTypeFilter<T extends Pick<Event, "type">>(
  events: T[],
): Record<EventTypeFilter, number> {
  let publicCount = 0;
  let privateCount = 0;

  for (const event of events) {
    if (isPrivateEventType(event.type)) {
      privateCount += 1;
    } else {
      publicCount += 1;
    }
  }

  return {
    all: events.length,
    public: publicCount,
    private: privateCount,
  };
}
