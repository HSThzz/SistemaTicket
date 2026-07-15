/**
 * @file Serializa entidade Event para resposta JSON da API.
 * @module modules/catalog/application/helpers/serializeEvent
 */

import type { Event } from "../../../../shared/infrastructure/persistence/entities/Event";

export interface SerializeEventOptions {
  /** Solicitações de participação pendentes (painel do produtor). */
  pendingParticipationCount?: number;
}

export function serializeEvent(event: Event, options?: SerializeEventOptions) {
  return {
    id: event.id,
    producerId: event.producerId,
    title: event.title,
    slug: event.slug,
    description: event.description,
    date: event.date.toISOString(),
    location: event.location,
    imageUrl: event.imageUrl,
    artists: Array.isArray(event.artists) ? event.artists : [],
    status: event.status,
    type: event.type,
    ticketLots: (event.ticketLots ?? []).map((lot) => ({
      id: lot.id,
      name: lot.name,
      price: lot.price,
      totalQuantity: lot.totalQuantity,
      availableQuantity: lot.availableQuantity,
    })),
    ...(options?.pendingParticipationCount !== undefined
      ? { pendingParticipationCount: options.pendingParticipationCount }
      : {}),
  };
}
