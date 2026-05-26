import type { CSSProperties } from "react";
import type { Event } from "../types/api";

const GRADIENT_PAIRS: [string, string][] = [
  ["#6366f1", "#a855f7"],
  ["#0ea5e9", "#6366f1"],
  ["#14b8a6", "#0ea5e9"],
  ["#f97316", "#ef4444"],
  ["#ec4899", "#8b5cf6"],
  ["#22c55e", "#14b8a6"],
];

export function getEventGradient(eventId: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < eventId.length; i += 1) {
    hash = eventId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GRADIENT_PAIRS[Math.abs(hash) % GRADIENT_PAIRS.length];
}

export function getEventCoverStyle(eventId: string): CSSProperties {
  const [from, to] = getEventGradient(eventId);
  return {
    background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
  };
}

export function extractCity(location: string): string {
  const parts = location.split(/[—\-,|]/).map((part) => part.trim());
  const last = parts[parts.length - 1];
  if (last && last.length <= 40) {
    return last.replace(/\bSP\b|\bRJ\b|\bMG\b/g, "").trim() || last;
  }
  return location.slice(0, 32);
}

export function getLowestPrice(event: Event): number | null {
  if (event.ticketLots.length === 0) {
    return null;
  }
  return Math.min(...event.ticketLots.map((lot) => lot.price));
}

export function getTotalAvailable(event: Event): number {
  return event.ticketLots.reduce((sum, lot) => sum + lot.availableQuantity, 0);
}

export function isEventSoon(event: Event, withinDays = 7): boolean {
  const eventDate = new Date(event.date);
  const now = new Date();
  const diffMs = eventDate.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= withinDays;
}

export type EventCategory = "all" | "festival" | "show" | "corporate" | "online";

const CATEGORY_KEYWORDS: Record<Exclude<EventCategory, "all">, string[]> = {
  festival: ["festival", "festa", "fest"],
  show: ["show", "comedy", "stand-up", "standup", "teatro", "espetáculo"],
  corporate: ["workshop", "corporativ", "palestra", "conferência", "summit"],
  online: ["online", "zoom", "virtual", "live"],
};

export function inferEventCategory(event: Event): Exclude<EventCategory, "all"> {
  const text = `${event.title} ${event.description} ${event.location}`.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as [
    Exclude<EventCategory, "all">,
    string[],
  ][]) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      return category;
    }
  }

  return "show";
}

export const CATEGORY_LABELS: Record<EventCategory, string> = {
  all: "Todos",
  festival: "Festivais",
  show: "Shows & teatro",
  corporate: "Corporativo",
  online: "Online",
};

export function filterEvents(
  events: Event[],
  query: string,
  category: EventCategory,
): Event[] {
  const normalizedQuery = query.trim().toLowerCase();

  return events.filter((event) => {
    const matchesCategory =
      category === "all" || inferEventCategory(event) === category;

    if (!matchesCategory) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const haystack = `${event.title} ${event.description} ${event.location}`.toLowerCase();
    return haystack.includes(normalizedQuery);
  });
}

export function groupEventsByCity(events: Event[]): Map<string, Event[]> {
  const groups = new Map<string, Event[]>();

  for (const event of events) {
    const city = extractCity(event.location);
    const existing = groups.get(city) ?? [];
    existing.push(event);
    groups.set(city, existing);
  }

  return groups;
}
