/**
 * @file Helpers visuais e de filtragem para cards e listagens de eventos.
 * @module utils/eventVisuals
 */

import type { CSSProperties } from "react";
import type { Event } from "@/shared/types/api";

const GRADIENT_PAIRS: [string, string][] = [
  ["#4ADE80", "#22C55E"],
  ["#22C55E", "#16A34A"],
  ["#4ADE80", "#16A34A"],
  ["#FF5C1A", "#FFD60A"],
  ["#22C55E", "#4ADE80"],
  ["#15803D", "#4ADE80"],
];

/** Dados mínimos para renderizar capa ou gradiente de um evento. */
export interface EventCoverSource {
  id: string;
  imageUrl?: string | null;
}

/**
 * Gera um par de cores de gradiente determinístico a partir do ID do evento.
 *
 * @param eventId - Identificador único do evento.
 */
export function getEventGradient(eventId: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < eventId.length; i += 1) {
    hash = eventId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GRADIENT_PAIRS[Math.abs(hash) % GRADIENT_PAIRS.length];
}

/**
 * URL da capa do evento, se houver imagem publicada.
 *
 * @param source - Evento ou objeto com `imageUrl` opcional.
 */
export function getEventCoverImageUrl(
  source: Pick<EventCoverSource, "imageUrl">,
): string | null {
  const imageUrl = source.imageUrl?.trim();
  return imageUrl || null;
}

/**
 * Dispara preload da capa no `<head>` e aquece o cache do navegador.
 * Seguro chamar várias vezes com a mesma URL.
 *
 * @param imageUrl - URL absoluta ou relativa da imagem.
 */
export function preloadEventCoverImage(imageUrl: string | null | undefined): void {
  const url = imageUrl?.trim();
  if (!url || typeof document === "undefined") {
    return;
  }

  const selector = `link[data-vibra-cover-preload="${CSS.escape(url)}"]`;
  if (document.head.querySelector(selector)) {
    return;
  }

  const link = document.createElement("link");
  link.rel = "preload";
  link.as = "image";
  link.href = url;
  link.setAttribute("fetchpriority", "high");
  link.setAttribute("data-vibra-cover-preload", url);
  document.head.appendChild(link);

  const img = new Image();
  img.decoding = "async";
  img.src = url;
}

/**
 * Retorna estilos CSS para capa do evento (imagem ou gradiente fallback).
 *
 * @param source - Evento ou objeto com `id` e `imageUrl` opcional.
 */
export function getEventCoverStyle(source: EventCoverSource): CSSProperties {
  const imageUrl = getEventCoverImageUrl(source);

  if (imageUrl !== null) {
    return {
      backgroundImage: `url("${imageUrl}")`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    };
  }

  const [from, to] = getEventGradient(source.id);
  return {
    background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
  };
}

/**
 * Extrai o nome da cidade a partir do campo de localização completo.
 *
 * @param location - Texto de local do evento.
 */
export function extractCity(location: string): string {
  const parts = location.split(/[—\-,|]/).map((part) => part.trim());
  const last = parts[parts.length - 1];
  if (last && last.length <= 40) {
    return last.replace(/\bSP\b|\bRJ\b|\bMG\b/g, "").trim() || last;
  }
  return location.slice(0, 32);
}

/**
 * Calcula o menor preço entre os lotes do evento, em centavos.
 *
 * @param event - Evento com lista de lotes.
 * @returns Menor preço ou `null` se não houver lotes.
 */
export function getLowestPrice(event: Event): number | null {
  if (event.ticketLots.length === 0) {
    return null;
  }
  return Math.min(...event.ticketLots.map((lot) => lot.price));
}

/**
 * Soma a quantidade disponível em todos os lotes do evento.
 *
 * @param event - Evento com lista de lotes.
 */
export function getTotalAvailable(event: Event): number {
  return event.ticketLots.reduce((sum, lot) => sum + lot.availableQuantity, 0);
}

/**
 * Indica se o evento ocorre nos próximos N dias (inclusive hoje).
 *
 * @param event - Evento com data ISO.
 * @param withinDays - Janela em dias (padrão: 7).
 */
export function isEventSoon(event: Event, withinDays = 7): boolean {
  const eventDate = new Date(event.date);
  const now = new Date();
  const diffMs = eventDate.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= withinDays;
}

/** Categorias de filtro exibidas na home e busca de eventos. */
export type EventCategory = "all" | "festival" | "show" | "corporate" | "online";

const CATEGORY_KEYWORDS: Record<Exclude<EventCategory, "all">, string[]> = {
  festival: ["festival", "festa", "fest"],
  show: ["show", "comedy", "stand-up", "standup", "teatro", "espetáculo"],
  corporate: ["workshop", "corporativ", "palestra", "conferência", "summit"],
  online: ["online", "zoom", "virtual", "live"],
};

/**
 * Infere a categoria do evento por palavras-chave no título, descrição e local.
 *
 * @param event - Evento a classificar.
 */
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

/** Rótulos em português para cada valor de {@link EventCategory}. */
export const CATEGORY_LABELS: Record<EventCategory, string> = {
  all: "Todos",
  festival: "Festivais",
  show: "Shows & teatro",
  corporate: "Corporativo",
  online: "Online",
};

/**
 * Filtra eventos por texto de busca e categoria inferida.
 *
 * @param events - Lista de eventos publicados.
 * @param query - Termo de busca (título, descrição, local).
 * @param category - Categoria selecionada ou `all`.
 */
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

/** Ordenação da vitrine de eventos. */
export type EventsSort = "date" | "price_asc" | "price_desc";

export const SORT_LABELS: Record<EventsSort, string> = {
  date: "Data",
  price_asc: "Menor preço",
  price_desc: "Maior preço",
};

/**
 * Indica se todos os lotes do evento estão esgotados.
 *
 * @param event - Evento com lista de lotes.
 */
export function isEventSoldOut(event: Event): boolean {
  return getTotalAvailable(event) === 0;
}

/**
 * Ordena eventos por data ou menor preço dos lotes.
 *
 * @param events - Lista já filtrada.
 * @param sort - Critério de ordenação.
 */
export function sortEvents(events: Event[], sort: EventsSort): Event[] {
  const copy = [...events];

  if (sort === "price_asc" || sort === "price_desc") {
    return copy.sort((left, right) => {
      const leftPrice = getLowestPrice(left);
      const rightPrice = getLowestPrice(right);

      if (leftPrice === null && rightPrice === null) {
        return 0;
      }
      if (leftPrice === null) {
        return 1;
      }
      if (rightPrice === null) {
        return -1;
      }

      return sort === "price_asc" ? leftPrice - rightPrice : rightPrice - leftPrice;
    });
  }

  return copy.sort(
    (left, right) => new Date(left.date).getTime() - new Date(right.date).getTime(),
  );
}

/**
 * Agrupa eventos por cidade extraída do campo de localização.
 *
 * @param events - Lista de eventos.
 */
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
