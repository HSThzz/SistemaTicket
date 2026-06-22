/**
 * @file Serializa eventos do painel do produtor com contagem de solicitações pendentes.
 * @module modules/catalog/application/helpers/serializeManagedEvents
 */

import type { Event } from "../../../../shared/infrastructure/persistence/entities/Event";
import { EventType } from "../../../../shared/kernel/enums";
import { countPendingParticipationByEventIds } from "../../../participation/application/queries/countPendingParticipationByEventIds";
import { serializeEvent } from "./serializeEvent";

export async function serializeManagedEvents(events: Event[]) {
  const privateEventIds = events
    .filter((event) => event.type === EventType.PRIVATE)
    .map((event) => event.id);

  const pendingCounts = await countPendingParticipationByEventIds(privateEventIds);

  return events.map((event) =>
    serializeEvent(event, {
      pendingParticipationCount:
        event.type === EventType.PRIVATE
          ? pendingCounts.get(event.id) ?? 0
          : undefined,
    }),
  );
}

export async function serializeManagedEvent(event: Event) {
  const [serialized] = await serializeManagedEvents([event]);
  return serialized;
}
