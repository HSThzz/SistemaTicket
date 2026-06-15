/**
 * @file Serializa entidade Event para resposta JSON da API.
 * @module modules/catalog/application/helpers/serializeEvent
 */

import type { Event } from "../../../../shared/infrastructure/persistence/entities/Event";

export function serializeEvent(event: Event) {
  return {
    id: event.id,
    producerId: event.producerId,
    title: event.title,
    description: event.description,
    date: event.date.toISOString(),
    location: event.location,
    imageUrl: event.imageUrl,
    artists: Array.isArray(event.artists) ? event.artists : [],
    status: event.status,
    ticketLots: (event.ticketLots ?? []).map((lot) => ({
      id: lot.id,
      name: lot.name,
      price: lot.price,
      totalQuantity: lot.totalQuantity,
      availableQuantity: lot.availableQuantity,
    })),
  };
}
