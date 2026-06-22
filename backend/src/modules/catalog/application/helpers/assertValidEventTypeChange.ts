/**
 * @file Valida se a mudança de tipo (PUBLIC/PRIVATE) do evento é permitida.
 * @module modules/catalog/application/helpers/assertValidEventTypeChange
 */

import type { Event } from "../../../../shared/infrastructure/persistence/entities/Event";
import type { EventType } from "../../../../shared/kernel/enums";
import { EventStatus } from "../../../../shared/kernel/enums";
import { EventTypeChangeNotAllowedError } from "../../domain/errors/EventError";
import { hasEventCommercialActivity } from "../queries/hasEventCommercialActivity";
import { hasParticipationRequestsForEvent } from "../../../participation/application/queries/hasParticipationRequestsForEvent";

/**
 * Permite alterar o tipo apenas em rascunho, sem solicitações de participação
 * e sem vendas/reservas/ingressos vinculados ao evento.
 * @throws {EventTypeChangeNotAllowedError} Quando a alteração viola alguma regra.
 */
export async function assertValidEventTypeChange(
  event: Event,
  nextType: EventType,
): Promise<void> {
  if (event.type === nextType) {
    return;
  }

  if (event.status !== EventStatus.DRAFT) {
    throw new EventTypeChangeNotAllowedError(
      "Event type can only be changed while the event is in draft status",
      "EVENT_TYPE_CHANGE_NOT_DRAFT",
    );
  }

  if (await hasParticipationRequestsForEvent(event.id)) {
    throw new EventTypeChangeNotAllowedError(
      "Event type cannot be changed after participation requests have been submitted",
      "EVENT_TYPE_CHANGE_HAS_PARTICIPATION_REQUESTS",
    );
  }

  if (await hasEventCommercialActivity(event.id)) {
    throw new EventTypeChangeNotAllowedError(
      "Event type cannot be changed after tickets have been reserved or sold",
      "EVENT_TYPE_CHANGE_HAS_COMMERCIAL_ACTIVITY",
    );
  }
}
